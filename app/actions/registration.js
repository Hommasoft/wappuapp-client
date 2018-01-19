import DeviceInfo from 'react-native-device-info';
import api from '../services/api';
import namegen from '../services/namegen';
import _ from 'lodash';
import {createRequestActionTypes} from '.';

const {
  CREATE_USER_REQUEST,
  CREATE_USER_SUCCESS,
  CREATE_USER_FAILURE
} = createRequestActionTypes('CREATE_USER');
const {
  GET_USER_REQUEST,
  GET_USER_SUCCESS,
  GET_USER_FAILURE
} = createRequestActionTypes('GET_USER');
const {
  LOGIN_REQUEST,
  LOGIN_SUCCESS,
  LOGIN_FAILURE
} = createRequestActionTypes('LOGIN');

const OPEN_REGISTRATION_VIEW = 'OPEN_REGISTRATION_VIEW';
const CLOSE_REGISTRATION_VIEW = 'CLOSE_REGISTRATION_VIEW';
const OPEN_LOGIN_VIEW = 'OPEN_LOGIN_VIEW';
const CLOSE_LOGIN_VIEW = 'CLOSE_LOGIN_VIEW';
const UPDATE_NAME = 'UPDATE_NAME';
const RESET = 'RESET';
const SELECT_TEAM = 'SELECT_TEAM';
const CLOSE_TEAM_SELECTOR = 'CLOSE_TEAM_SELECTOR';
const DISMISS_INTRODUCTION = 'DISMISS_INTRODUCTION';

const openRegistrationView = () => {
  return { type: OPEN_REGISTRATION_VIEW };
};

const closeRegistrationView = () => {
  return { type: CLOSE_REGISTRATION_VIEW };
};

const dismissIntroduction = () => {
  return { type: DISMISS_INTRODUCTION };
};

const putUser = () => {
  return (dispatch, getStore) => {
    dispatch({ type: CREATE_USER_REQUEST });
    const uuid = DeviceInfo.getUniqueID();
    const name = getStore().registration.get('name');
    const team = getStore().registration.get('selectedTeam');
    return api.putUser({ uuid, name, team })
      .then(response => {
        dispatch({ type: CREATE_USER_SUCCESS });
        dispatch({ type: CLOSE_REGISTRATION_VIEW });
      })
      .catch(error => dispatch({ type: CREATE_USER_FAILURE, error: error }));
  };
};
const selectTeam = team => {
  return (dispatch, getStore) => {
    const teams = getStore().team.get('teams').toJS();
    const currentName = getStore().registration.get('name');
    const currentTeam = _.find(teams, ['id', team]);

    dispatch({ type: CLOSE_TEAM_SELECTOR });
    dispatch({ type: SELECT_TEAM, payload: team });
    // Generate new name if not given name
    if (!currentName) {
      dispatch({ type: UPDATE_NAME, payload: namegen.generateName(currentTeam.name) });
    }
  };
};
const updateName = name => {
  return { type: UPDATE_NAME, payload: name };
};

const reset = () => {
  return { type: RESET };
};

const generateName = () => {
  return (dispatch, getStore) => {
    const currentTeamId = getStore().registration.get('selectedTeam');

    if (currentTeamId) {
      const teams = getStore().team.get('teams').toJS();
      const selectedTeam = _.find(teams, ['id', currentTeamId]);
      if (selectedTeam) {
        dispatch({ type: UPDATE_NAME, payload: namegen.generateName(selectedTeam.name) });
      }
    }
  };
};

const getUser = () => {
  return dispatch => {
    dispatch({ type: GET_USER_REQUEST });
    const uuid = DeviceInfo.getUniqueID();
    return api.getUser(uuid)
      .then(user => {
        dispatch({ type: GET_USER_SUCCESS, payload: user });
      })
      .catch(error => {
        dispatch({ type: GET_USER_FAILURE, error: error });
      });
  };
};

const loginModerator = (email, password) => {
  return dispatch => {
    dispatch({ type: LOGIN_REQUEST });
    return api.postLogin({ email: email, password: password })
      .then(response => {
        dispatch({ type: LOGIN_SUCCESS, payload: response });
      })
      .catch(error => {
        dispatch({ type: LOGIN_FAILURE});
      });
  };
};

const openLoginView = () => {
  return { type: OPEN_LOGIN_VIEW };
};

const closeLoginView = () => {
  return { type: CLOSE_LOGIN_VIEW };
};

export {
  CREATE_USER_REQUEST,
  CREATE_USER_SUCCESS,
  CREATE_USER_FAILURE,
  OPEN_REGISTRATION_VIEW,
  CLOSE_REGISTRATION_VIEW,
  UPDATE_NAME,
  GET_USER_REQUEST,
  GET_USER_SUCCESS,
  GET_USER_FAILURE,
  LOGIN_REQUEST,
  LOGIN_SUCCESS,
  LOGIN_FAILURE,
  OPEN_LOGIN_VIEW,
  CLOSE_LOGIN_VIEW,
  SELECT_TEAM,
  RESET,
  DISMISS_INTRODUCTION,
  putUser,
  openRegistrationView,
  closeRegistrationView,
  updateName,
  generateName,
  getUser,
  selectTeam,
  reset,
  dismissIntroduction,
  loginModerator,
  openLoginView,
  closeLoginView
};
