import Endpoint, { IterableEndpoint } from './endpoint';
import {
    AddonEndpoint,
    CodeJobsEndpoint,
    DistributorFlagsEndpoint,
    TypeMetaData,
    MaintenanceEndpoint,
    AuditLogsEndpoint,
    SyncEndpoint,
    FileStorageEndpoint,
} from './endpoints';
import {
    UserDefinedTableMetaData,
    UserDefinedTableRow,
    Account,
    GeneralActivity,
    Transaction,
    User,
    UIControl,
    Profile,
    DataView,
    PepperiObject,
    Type,
    Catalog,
} from './entities';

import { papi_performance, papi_fetch } from './papi-module';

type HttpMethod = 'POST' | 'GET' | 'PUT' | 'DELETE';

interface PapiClientOptions {
    token: string;
    baseURL: string;
    addonUUID?: string;
    suppressLogging?: boolean;
    addonSecretKey?: string;
    actionUUID?: string;
}

export class PapiClient {
    metaData = {
        userDefinedTables: new Endpoint<UserDefinedTableMetaData>(this, '/meta_data/user_defined_tables'),
        flags: new DistributorFlagsEndpoint(this),
        type: (typeObject: string) => {
            return new TypeMetaData(this, typeObject);
        },
        dataViews: new Endpoint<DataView>(this, '/meta_data/data_views'),
        pepperiObjects: new Endpoint<PepperiObject>(this, '/meta_data/pepperiObjects'),
    };

    userDefinedTables = new Endpoint<UserDefinedTableRow>(this, '/user_defined_tables');
    addons = new AddonEndpoint(this);
    codeJobs = new CodeJobsEndpoint(this);
    activities = new Endpoint<GeneralActivity>(this, '/activities');
    transactions = new Endpoint<Transaction>(this, '/transactions');
    allActivities = new Endpoint<GeneralActivity | Transaction>(this, '/all_activities');
    accounts = new Endpoint<Account>(this, '/accounts');
    users = new Endpoint<User>(this, '/users');
    uiControls = new Endpoint<UIControl>(this, '/uicontrols');
    profiles = new Endpoint<Profile>(this, '/profiles');
    fileStorage = new FileStorageEndpoint(this);
    maintenance = new MaintenanceEndpoint(this);
    auditLogs = new AuditLogsEndpoint(this);
    types = new IterableEndpoint<Type>(this, '/types');
    catalogs = new Endpoint<Catalog>(this, '/catalogs');
    application = {
        sync: new SyncEndpoint(this),
    };

    constructor(private options: PapiClientOptions) {}

    async get(url: string): Promise<any> {
        return this.apiCall('GET', url)
            .then((res) => res.text())
            .then((res) => (res ? JSON.parse(res) : ''));
    }

    async post(url: string, body: any = undefined, headers: any = undefined): Promise<any> {
        return this.apiCall('POST', url, body, headers)
            .then((res) => res.text())
            .then((res) => (res ? JSON.parse(res) : ''));
    }

    async delete(url: string): Promise<any> {
        return this.apiCall('DELETE', url);
    }

    async apiCall(method: HttpMethod, url: string, body: any = undefined, headers: any = undefined) {
        const fullURL = this.options.baseURL + url;
        const options: any = {
            method: method,
            headers: {
                authorization: 'Bearer ' + this.options.token,
                ...headers,
            },
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        if (this.options.addonUUID) {
            options.headers['X-Pepperi-OwnerID'] = this.options.addonUUID;
        }

        if (this.options.addonSecretKey) {
            options.headers['X-Pepperi-SecretKey'] = this.options.addonSecretKey;
        }

        if (this.options.actionUUID) {
            options.headers['X-Pepperi-ActionID'] = this.options.actionUUID;
        }
        const t0 = papi_performance ? papi_performance.now() : 0;
        const res = await papi_fetch(fullURL, options);
        const t1 = papi_performance ? papi_performance.now() : 0;

        if (!this.options.suppressLogging) {
            console.log(method, fullURL, 'took', (t1 - t0).toFixed(2), 'milliseconds');
        }

        if (!res.ok) {
            // try parsing error as json
            let error = '';
            try {
                error = JSON.stringify(await res.json());
            } catch {}

            throw new Error(`${fullURL} failed with status: ${res.status} - ${res.statusText} error: ${error}`);
        }

        return res;
    }
}
