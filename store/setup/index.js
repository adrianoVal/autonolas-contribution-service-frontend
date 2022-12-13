import { apiTypes, syncTypes } from './_types';

const initialState = {
  account: null,
  balance: null,
  chainId: null,
  errorMessage: null,
  /**
   * initially set to true to avoid glitch
   * (util the API is completed)
   */
  isVerified: true,
  healthcheck: {
    seconds_since_last_reset: 12,
    healthy: true,
    seconds_untime_next_update: 18,
  },
};

export default (state = initialState, action) => {
  const { data } = action;

  switch (action.type) {
    case apiTypes.GET_API: {
      return { ...state, data };
    }

    case syncTypes.SET_ACCOUNT:
    case syncTypes.SET_BALANCE:
    case syncTypes.SET_LOGIN_ERROR:
    case syncTypes.SET_CHAIND_ID:
    case syncTypes.SET_WALLET_VERIFICATION:
    case syncTypes.SET_HEALTH_CHECK:
    case syncTypes.SET_STORE_STATE: {
      return { ...state, ...action.data };
    }

    case syncTypes.SET_LOGOUT: {
      return {
        ...state,
        account: null,
        balance: null,
        errorMessage: null,
        isVerified: false,
      };
    }

    default:
      return state;
  }
};
