import { receive as userReceive } from 'actions/user';
import { receiveNotification as workflowReceiveNotification } from 'actions/workflow';

// socket.on('user', data => console.log(data));
// socket.on('login', data => console.log(data));
// socket.on('login_ack', data => console.log(data));
// socket.on('logout_ack', data => console.log(data));
// socket.on('response', data => console.log(data));
// socket.on('notification', data => console.log(data));

export default {
    user: userReceive,
    notification: workflowReceiveNotification
};
