"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
/* eslint-disable-next-line import/no-extraneous-dependencies */
const client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
const redshift_data_1 = require("./redshift-data");
const util_1 = require("./util");
const secretsManager = new client_secrets_manager_1.SecretsManager({});
async function handler(props, event) {
    const username = props.username;
    const passwordSecretArn = props.passwordSecretArn;
    const clusterProps = props;
    if (event.RequestType === 'Create') {
        await createUser(username, passwordSecretArn, clusterProps);
        return { PhysicalResourceId: (0, util_1.makePhysicalId)(username, clusterProps, event.RequestId), Data: { username: username } };
    }
    else if (event.RequestType === 'Delete') {
        await dropUser(username, clusterProps);
        return;
    }
    else if (event.RequestType === 'Update') {
        const { replace } = await updateUser(username, passwordSecretArn, clusterProps, event.OldResourceProperties);
        const physicalId = replace ? (0, util_1.makePhysicalId)(username, clusterProps, event.RequestId) : event.PhysicalResourceId;
        return { PhysicalResourceId: physicalId, Data: { username: username } };
    }
    else {
        /* eslint-disable-next-line dot-notation */
        throw new Error(`Unrecognized event type: ${event['RequestType']}`);
    }
}
exports.handler = handler;
async function dropUser(username, clusterProps) {
    await (0, redshift_data_1.executeStatement)(`DROP USER ${username}`, clusterProps);
}
async function createUser(username, passwordSecretArn, clusterProps) {
    const password = await getPasswordFromSecret(passwordSecretArn);
    await (0, redshift_data_1.executeStatement)(`CREATE USER ${username} PASSWORD '${password}'`, clusterProps);
}
async function updateUser(username, passwordSecretArn, clusterProps, oldResourceProperties) {
    const oldClusterProps = oldResourceProperties;
    if (clusterProps.clusterName !== oldClusterProps.clusterName || clusterProps.databaseName !== oldClusterProps.databaseName) {
        await createUser(username, passwordSecretArn, clusterProps);
        return { replace: true };
    }
    const oldUsername = oldResourceProperties.username;
    const oldPasswordSecretArn = oldResourceProperties.passwordSecretArn;
    const oldPassword = await getPasswordFromSecret(oldPasswordSecretArn);
    const password = await getPasswordFromSecret(passwordSecretArn);
    if (username !== oldUsername) {
        await createUser(username, passwordSecretArn, clusterProps);
        return { replace: true };
    }
    if (password !== oldPassword) {
        await (0, redshift_data_1.executeStatement)(`ALTER USER ${username} PASSWORD '${password}'`, clusterProps);
        return { replace: false };
    }
    return { replace: false };
}
async function getPasswordFromSecret(passwordSecretArn) {
    const secretValue = await secretsManager.getSecretValue({
        SecretId: passwordSecretArn,
    });
    const secretString = secretValue.SecretString;
    if (!secretString) {
        throw new Error(`Secret string for ${passwordSecretArn} was empty`);
    }
    const { password } = JSON.parse(secretString);
    return password;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInVzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEsZ0VBQWdFO0FBQ2hFLDRFQUFpRTtBQUNqRSxtREFBbUQ7QUFFbkQsaUNBQXdDO0FBR3hDLE1BQU0sY0FBYyxHQUFHLElBQUksdUNBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUV2QyxLQUFLLFVBQVUsT0FBTyxDQUFDLEtBQXNDLEVBQUUsS0FBa0Q7SUFDdEgsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQztJQUNoQyxNQUFNLGlCQUFpQixHQUFHLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQztJQUNsRCxNQUFNLFlBQVksR0FBRyxLQUFLLENBQUM7SUFFM0IsSUFBSSxLQUFLLENBQUMsV0FBVyxLQUFLLFFBQVEsRUFBRSxDQUFDO1FBQ25DLE1BQU0sVUFBVSxDQUFDLFFBQVEsRUFBRSxpQkFBaUIsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUM1RCxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsSUFBQSxxQkFBYyxFQUFDLFFBQVEsRUFBRSxZQUFZLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsRUFBRSxDQUFDO0lBQ3ZILENBQUM7U0FBTSxJQUFJLEtBQUssQ0FBQyxXQUFXLEtBQUssUUFBUSxFQUFFLENBQUM7UUFDMUMsTUFBTSxRQUFRLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ3ZDLE9BQU87SUFDVCxDQUFDO1NBQU0sSUFBSSxLQUFLLENBQUMsV0FBVyxLQUFLLFFBQVEsRUFBRSxDQUFDO1FBQzFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsR0FBRyxNQUFNLFVBQVUsQ0FDbEMsUUFBUSxFQUNSLGlCQUFpQixFQUNqQixZQUFZLEVBQ1osS0FBSyxDQUFDLHFCQUFtRSxDQUFDLENBQUM7UUFDN0UsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFD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QyxZQUFZLENBQUMsQ0FBQztJQUU5QyxPQUFPLFFBQVEsQ0FBQztBQUNsQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGltcG9ydC9uby11bnJlc29sdmVkICovXG5pbXBvcnQgKiBhcyBBV1NMYW1iZGEgZnJvbSAnYXdzLWxhbWJkYSc7XG4vKiBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgaW1wb3J0L25vLWV4dHJhbmVvdXMtZGVwZW5kZW5jaWVzICovXG5pbXBvcnQgeyBTZWNyZXRzTWFuYWdlciB9IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1zZWNyZXRzLW1hbmFnZXInO1xuaW1wb3J0IHsgZXhlY3V0ZVN0YXRlbWVudCB9IGZyb20gJy4vcmVkc2hpZnQtZGF0YSc7XG5pbXBvcnQgeyBDbHVzdGVyUHJvcHMgfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IG1ha2VQaHlzaWNhbElkIH0gZnJvbSAnLi91dGlsJztcbmltcG9ydCB7IFVzZXJIYW5kbGVyUHJvcHMgfSBmcm9tICcuLi9oYW5kbGVyLXByb3BzJztcblxuY29uc3Qgc2VjcmV0c01hbmFnZXIgPSBuZXcgU2VjcmV0c01hbmFnZXIoe30pO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihwcm9wczogVXNlckhhbmRsZXJQcm9wcyAmIENsdXN0ZXJQcm9wcywgZXZlbnQ6IEFXU0xhbWJkYS5DbG91ZEZvcm1hdGlvbkN1c3RvbVJlc291cmNlRXZlbnQpIHtcbiAgY29uc3QgdXNlcm5hbWUgPSBwcm9wcy51c2VybmFtZTtcbiAgY29uc3QgcGFzc3dvcmRTZWNyZXRBcm4gPSBwcm9wcy5wYXNzd29yZFNlY3JldEFybjtcbiAgY29uc3QgY2x1c3RlclByb3BzID0gcHJvcHM7XG5cbiAgaWYgKGV2ZW50LlJlcXVlc3RUeXBlID09PSAnQ3JlYXRlJykge1xuICAgIGF3YWl0IGNyZWF0ZVVzZXIodXNlcm5hbWUsIHBhc3N3b3JkU2VjcmV0QXJuLCBjbHVzdGVyUHJvcHMpO1xuICAgIHJldHVybiB7IFBoeXNpY2FsUmVzb3VyY2VJZDogbWFrZVBoeXNpY2FsSWQodXNlcm5hbWUsIGNsdXN0ZXJQcm9wcywgZXZlbnQuUmVxdWVzdElkKSwgRGF0YTogeyB1c2VybmFtZTogdXNlcm5hbWUgfSB9O1xuICB9IGVsc2UgaWYgKGV2ZW50LlJlcXVlc3RUeXBlID09PSAnRGVsZXRlJykge1xuICAgIGF3YWl0IGRyb3BVc2VyKHVzZXJuYW1lLCBjbHVzdGVyUHJvcHMpO1xuICAgIHJldHVybjtcbiAgfSBlbHNlIGlmIChldmVudC5SZXF1ZXN0VHlwZSA9PT0gJ1VwZGF0ZScpIHtcbiAgICBjb25zdCB7IHJlcGxhY2UgfSA9IGF3YWl0IHVwZGF0ZVVzZXIoXG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkU2VjcmV0QXJuLFxuICAgICAgY2x1c3RlclByb3BzLFxuICAgICAgZXZlbnQuT2xkUmVzb3VyY2VQcm9wZXJ0aWVzIGFzIHVua25vd24gYXMgVXNlckhhbmRsZXJQcm9wcyAmIENsdXN0ZXJQcm9wcyk7XG4gICAgY29uc3QgcGh5c2ljYWxJZCA9IHJlcGxhY2UgPyBtYWtlUGh5c2ljYWxJZCh1c2VybmFtZSwgY2x1c3RlclByb3BzLCBldmVudC5SZXF1ZXN0SWQpIDogZXZlbnQuUGh5c2ljYWxSZXNvdXJjZUlkO1xuICAgIHJldHVybiB7IFBoeXNpY2FsUmVzb3VyY2VJZDogcGh5c2ljYWxJZCwgRGF0YTogeyB1c2VybmFtZTogdXNlcm5hbWUgfSB9O1xuICB9IGVsc2Uge1xuICAgIC8qIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBkb3Qtbm90YXRpb24gKi9cbiAgICB0aHJvdyBuZXcgRXJyb3IoYFVucmVjb2duaXplZCBldmVudCB0eXBlOiAke2V2ZW50WydSZXF1ZXN0VHlwZSddfWApO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGRyb3BVc2VyKHVzZXJuYW1lOiBzdHJpbmcsIGNsdXN0ZXJQcm9wczogQ2x1c3RlclByb3BzKSB7XG4gIGF3YWl0IGV4ZWN1dGVTdGF0ZW1lbnQoYERST1AgVVNFUiAke3VzZXJuYW1lfWAsIGNsdXN0ZXJQcm9wcyk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZVVzZXIodXNlcm5hbWU6IHN0cmluZywgcGFzc3dvcmRTZWNyZXRBcm46IHN0cmluZywgY2x1c3RlclByb3BzOiBDbHVzdGVyUHJvcHMpIHtcbiAgY29uc3QgcGFzc3dvcmQgPSBhd2FpdCBnZXRQYXNzd29yZEZyb21TZWNyZXQocGFzc3dvcmRTZWNyZXRBcm4pO1xuXG4gIGF3YWl0IGV4ZWN1dGVTdGF0ZW1lbnQoYENSRUFURSBVU0VSICR7dXNlcm5hbWV9IFBBU1NXT1JEICcke3Bhc3N3b3JkfSdgLCBjbHVzdGVyUHJvcHMpO1xufVxuXG5hc3luYyBmdW5jdGlvbiB1cGRhdGVVc2VyKFxuICB1c2VybmFtZTogc3RyaW5nLFxuICBwYXNzd29yZFNlY3JldEFybjogc3RyaW5nLFxuICBjbHVzdGVyUHJvcHM6IENsdXN0ZXJQcm9wcyxcbiAgb2xkUmVzb3VyY2VQcm9wZXJ0aWVzOiBVc2VySGFuZGxlclByb3BzICYgQ2x1c3RlclByb3BzLFxuKTogUHJvbWlzZTx7IHJlcGxhY2U6IGJvb2xlYW4gfT4ge1xuICBjb25zdCBvbGRDbHVzdGVyUHJvcHMgPSBvbGRSZXNvdXJjZVByb3BlcnRpZXM7XG4gIGlmIChjbHVzdGVyUHJvcHMuY2x1c3Rlck5hbWUgIT09IG9sZENsdXN0ZXJQcm9wcy5jbHVzdGVyTmFtZSB8fCBjbHVzdGVyUHJvcHMuZGF0YWJhc2VOYW1lICE9PSBvbGRDbHVzdGVyUHJvcHMuZGF0YWJhc2VOYW1lKSB7XG4gICAgYXdhaXQgY3JlYXRlVXNlcih1c2VybmFtZSwgcGFzc3dvcmRTZWNyZXRBcm4sIGNsdXN0ZXJQcm9wcyk7XG4gICAgcmV0dXJuIHsgcmVwbGFjZTogdHJ1ZSB9O1xuICB9XG5cbiAgY29uc3Qgb2xkVXNlcm5hbWUgPSBvbGRSZXNvdXJjZVByb3BlcnRpZXMudXNlcm5hbWU7XG4gIGNvbnN0IG9sZFBhc3N3b3JkU2VjcmV0QXJuID0gb2xkUmVzb3VyY2VQcm9wZXJ0aWVzLnBhc3N3b3JkU2VjcmV0QXJuO1xuICBjb25zdCBvbGRQYXNzd29yZCA9IGF3YWl0IGdldFBhc3N3b3JkRnJvbVNlY3JldChvbGRQYXNzd29yZFNlY3JldEFybik7XG4gIGNvbnN0IHBhc3N3b3JkID0gYXdhaXQgZ2V0UGFzc3dvcmRGcm9tU2VjcmV0KHBhc3N3b3JkU2VjcmV0QXJuKTtcblxuICBpZiAodXNlcm5hbWUgIT09IG9sZFVzZXJuYW1lKSB7XG4gICAgYXdhaXQgY3JlYXRlVXNlcih1c2VybmFtZSwgcGFzc3dvcmRTZWNyZXRBcm4sIGNsdXN0ZXJQcm9wcyk7XG4gICAgcmV0dXJuIHsgcmVwbGFjZTogdHJ1ZSB9O1xuICB9XG5cbiAgaWYgKHBhc3N3b3JkICE9PSBvbGRQYXNzd29yZCkge1xuICAgIGF3YWl0IGV4ZWN1dGVTdGF0ZW1lbnQoYEFMVEVSIFVTRVIgJHt1c2VybmFtZX0gUEFTU1dPUkQgJyR7cGFzc3dvcmR9J2AsIGNsdXN0ZXJQcm9wcyk7XG4gICAgcmV0dXJuIHsgcmVwbGFjZTogZmFsc2UgfTtcbiAgfVxuXG4gIHJldHVybiB7IHJlcGxhY2U6IGZhbHNlIH07XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldFBhc3N3b3JkRnJvbVNlY3JldChwYXNzd29yZFNlY3JldEFybjogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgY29uc3Qgc2VjcmV0VmFsdWUgPSBhd2FpdCBzZWNyZXRzTWFuYWdlci5nZXRTZWNyZXRWYWx1ZSh7XG4gICAgU2VjcmV0SWQ6IHBhc3N3b3JkU2VjcmV0QXJuLFxuICB9KTtcbiAgY29uc3Qgc2VjcmV0U3RyaW5nID0gc2VjcmV0VmFsdWUuU2VjcmV0U3RyaW5nO1xuICBpZiAoIXNlY3JldFN0cmluZykge1xuICAgIHRocm93IG5ldyBFcnJvcihgU2VjcmV0IHN0cmluZyBmb3IgJHtwYXNzd29yZFNlY3JldEFybn0gd2FzIGVtcHR5YCk7XG4gIH1cbiAgY29uc3QgeyBwYXNzd29yZCB9ID0gSlNPTi5wYXJzZShzZWNyZXRTdHJpbmcpO1xuXG4gIHJldHVybiBwYXNzd29yZDtcbn1cbiJdfQ==