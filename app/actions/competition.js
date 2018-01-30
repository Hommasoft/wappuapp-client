'use strict';

import { isNil } from 'lodash';
import api from '../services/api';
import ActionTypes from '../constants/ActionTypes';
import * as NotificationMessages from '../utils/notificationMessage';
import { refreshFeed, loadComments } from './feed';
import { sortFeedChronological } from '../concepts/sortType';
import { getCityId } from '../concepts/city';
import {createRequestActionTypes} from '.';

const {
  POST_ACTION_REQUEST,
  POST_ACTION_SUCCESS,
  POST_ACTION_FAILURE
} = createRequestActionTypes('POST_ACTION');
const {
  GET_ACTION_TYPES_REQUEST,
  GET_ACTION_TYPES_SUCCESS,
  GET_ACTION_TYPES_FAILURE
} = createRequestActionTypes('GET_ACTION_TYPES');

const OPEN_TEXTACTION_VIEW = 'OPEN_TEXTACTION_VIEW';
const CLOSE_TEXTACTION_VIEW = 'CLOSE_TEXTACTION_VIEW';
const OPEN_COMMENTACTION_VIEW = 'OPEN_COMMENTACTION_VIEW';
const CLOSE_COMMENTACTION_VIEW = 'CLOSE_COMMENTACTION_VIEW';
const OPEN_CHECKIN_VIEW = 'OPEN_CHECKIN_VIEW';
const CLOSE_CHECKIN_VIEW = 'CLOSE_CHECKIN_VIEW';
const SHOW_NOTIFICATION = 'SHOW_NOTIFICATION';
const HIDE_NOTIFICATION = 'HIDE_NOTIFICATION';
const UPDATE_COOLDOWNS = 'UPDATE_COOLDOWNS';

const openTextActionView = () => {
  return { type: OPEN_TEXTACTION_VIEW };
};

const closeTextActionView = () => {
  return { type: CLOSE_TEXTACTION_VIEW };
};

const openCommentActionView = (id) => {
   return { type: OPEN_COMMENTACTION_VIEW, parentId: id };
};

const closeCommentActionView = () => {
  return { type: CLOSE_COMMENTACTION_VIEW };
};

const openCheckInView = () => {
  return { type : OPEN_CHECKIN_VIEW };
};

const closeCheckInView = () => {
  return { type: CLOSE_CHECKIN_VIEW };
};

const _postAction = (payload, isComment, offset) => {
  return (dispatch, getState) => {
    dispatch({ type: POST_ACTION_REQUEST });

    const state = getState();
    const cityId = getCityId(state);
    const queryParams = !isNil(cityId) ? { cityId } : {};

    return api.postAction(payload, state.location.get('currentLocation'), queryParams)
      .then(response => {
         setTimeout(() => {

            // Set feed sort to 'new' if posted image or text, otherwise just refresh
            // If posted comment, don't do anything
            if (isComment) {
              dispatch(loadComments(payload.parent_id, offset));
            } else if ([ActionTypes.TEXT, ActionTypes.IMAGE].indexOf(payload.type) >= 0) {
              dispatch(sortFeedChronological())
            } else {
              dispatch(refreshFeed());
            }

            dispatch({ type: POST_ACTION_SUCCESS, payload: { type: payload.type } });
            dispatch({ type: SHOW_NOTIFICATION, payload: NotificationMessages.getMessage(payload) });

         }, 1000);

        setTimeout(() => {
          dispatch({ type: HIDE_NOTIFICATION });
        }, 3000);
      })
      .catch(e => {
        console.log('Error catched on competition action post!', e);

        if (e.response.status === 429) {
          dispatch({
            type: SHOW_NOTIFICATION,
            payload: NotificationMessages.getRateLimitMessage(payload)
          });
        } else if (e.response.status === 403) {
          dispatch({
            type: SHOW_NOTIFICATION,
            payload: NotificationMessages.getInvalidEventMessage(payload)
          });
        } else {
          dispatch({
            type: SHOW_NOTIFICATION,
            payload: NotificationMessages.getErrorMessage(payload)
          });
        }
        dispatch({ type: POST_ACTION_FAILURE, error: e });

        setTimeout(() => {
          dispatch({ type: HIDE_NOTIFICATION });
        }, 3000);
      });
  };
};

const postAction = type => {
  return _postAction({
    type
  });
};

const postText = text => {
  return _postAction({
    type: ActionTypes.TEXT,
    text: text
  });
};

const postComment = (text, parentId, offset) => {
  return _postAction({
    type: ActionTypes.TEXT,
    text: text,
    parent_id: parentId
  }, true, offset)
};

const postImage = (image, imageText, imageTextPosition) => {
  const postObject = Object.assign({
    type: ActionTypes.IMAGE,
    imageData: image,
  }, !!imageText ? { imageText, imageTextPosition } : {});
  return _postAction(postObject);
};

const checkIn = eventId => {
  return _postAction({
    type: ActionTypes.CHECK_IN_EVENT,
    eventId: eventId
  });
}

const fetchActionTypes = () => {
  return dispatch => {
    dispatch({ type: GET_ACTION_TYPES_REQUEST });
    api.fetchModels('actionTypes')
      .then(actionTypes => dispatch({ type: GET_ACTION_TYPES_SUCCESS, payload: actionTypes }))
      .catch(e => dispatch({ type: GET_ACTION_TYPES_FAILURE, error: true, payload: e }));
  };
};

const updateCooldowns = () => {
  return { type: UPDATE_COOLDOWNS };
};

export {
  POST_ACTION_REQUEST,
  POST_ACTION_SUCCESS,
  POST_ACTION_FAILURE,
  GET_ACTION_TYPES_REQUEST,
  GET_ACTION_TYPES_SUCCESS,
  GET_ACTION_TYPES_FAILURE,
  OPEN_TEXTACTION_VIEW,
  OPEN_COMMENTACTION_VIEW,
  OPEN_CHECKIN_VIEW,
  CLOSE_CHECKIN_VIEW,
  CLOSE_COMMENTACTION_VIEW,
  CLOSE_TEXTACTION_VIEW,
  SHOW_NOTIFICATION,
  HIDE_NOTIFICATION,
  UPDATE_COOLDOWNS,
  postAction,
  postText,
  postComment,
  postImage,
  openCheckInView,
  checkIn,
  closeCheckInView,
  openTextActionView,
  closeTextActionView,
  openCommentActionView,
  closeCommentActionView,
  fetchActionTypes,
  updateCooldowns
};
