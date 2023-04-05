import { readFileSync } from 'fs';
import path from 'path';
import * as samlify from 'samlify';

const binding = samlify.Constants.namespace.binding;

// Todo: for testing only i put the metadata in the file system. This should be in the config
const sp = samlify.ServiceProvider({
    metadata: readFileSync(path.resolve(__dirname, 'metadata_sp.xml'))
});

const idp = samlify.IdentityProvider({
    metadata: readFileSync(path.resolve(__dirname, 'metadata_idp.xml'))
});

samlify.setSchemaValidator({
    validate: (response: string) => {
        /* implment your own or always returns a resolved promise to skip */
        return Promise.resolve('skipped');
    }
});

export default { sp, idp };
