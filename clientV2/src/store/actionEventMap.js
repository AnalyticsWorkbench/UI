import { receive as userReceive } from 'clientV2/src/actions/user';
import { receiveNotification as workflowReceiveNotification } from 'clientV2/src/actions/workflow';

//socket.on('user', data => console.log(data));
// socket.on('login', data => console.log(data));
// socket.on('login_ack', data => console.log(data));
// socket.on('logout_ack', data => console.log(data));
// socket.on('response', data => console.log(data));
// socket.on('notification', data => console.log(data));

export default {
    user: userReceive,
    notification: workflowReceiveNotification
};
