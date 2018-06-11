const initialState = {
	user: undefined
};

export default function user(state = initialState, action) {
    switch (action.type) {
		case 'USER_RECEIVE': {
            return {
				...state,
				user: action.payload.user
			};
		}
        default: {
            return state;
		}
    }
}
