import DeviceInfo from 'react-native-device-info';

import api from '../services/api';
import {createRequestActionTypes} from '.';
import { AsyncStorage }  from 'react-native';
import { getCityId } from '../concepts/city';
import { getFeedSortType } from '../concepts/sortType';
import { getAllPostsInStore } from '../reducers/feed';

import * as NotificationMessages from '../utils/notificationMessage';
import { SHOW_NOTIFICATION, HIDE_NOTIFICATION } from '../actions/competition';
import { LOGOUT} from '../actions/registration';

import { APP_STORAGE_KEY } from '../../env';
const modKey = `${APP_STORAGE_KEY}:mod`;

const USER_UUID = DeviceInfo.getUniqueID();

const SET_FEED = 'SET_FEED';
const APPEND_FEED = 'APPEND_FEED';

const {
  GET_FEED_REQUEST,
  GET_FEED_SUCCESS,
  GET_FEED_FAILURE
} = createRequestActionTypes('GET_FEED');
const {
  REFRESH_FEED_REQUEST,
  REFRESH_FEED_SUCCESS,
  // Failure of refresh is also modeled as "success"
  // REFRESH_FEED_FAILURE
} = createRequestActionTypes('REFRESH_FEED');
const DELETE_FEED_ITEM = 'DELETE_FEED_ITEM';

const {
  VOTE_FEED_ITEM_REQUEST,
  VOTE_FEED_ITEM_SUCCESS,
} = createRequestActionTypes('VOTE_FEED_ITEM');


const fetchFeed = () => (dispatch, getState) => {
  const cityId = getCityId(getState());
  const sort = getFeedSortType(getState());

  if (!cityId) {
    return;
  }

  dispatch({ type: GET_FEED_REQUEST });
  return api.fetchModels('feed', { cityId, sort })
  .then(items => {
    dispatch({
      type: SET_FEED,
      feed: items
    });

    dispatch({ type: GET_FEED_SUCCESS });
  })
  .catch(error => dispatch({ type: GET_FEED_FAILURE, error: true, payload: error }));
};

const refreshFeed = () => (dispatch, getState) => {
  dispatch({ type: REFRESH_FEED_REQUEST });

  const cityId = getCityId(getState());
  const sort = getFeedSortType(getState());
  return api.fetchModels('feed', { cityId, sort })
  .then(items => {
    dispatch({
      type: SET_FEED,
      feed: items
    });
    dispatch({ type: REFRESH_FEED_SUCCESS });
    dispatch({ type: GET_FEED_SUCCESS });
  })
  .catch(error => dispatch({ type: REFRESH_FEED_SUCCESS, error: true, payload: error }));
};

const loadMoreItems = (lastID) => (dispatch, getState) => {
  dispatch({ type: REFRESH_FEED_REQUEST });

  const cityId = getCityId(getState());
  const sort = getFeedSortType(getState());
  return api.fetchMoreFeed(lastID, { cityId, sort })
  .then(items => {
    dispatch({
      type: APPEND_FEED,
      feed: items
    });
    dispatch({ type: REFRESH_FEED_SUCCESS });
    dispatch({ type: GET_FEED_SUCCESS });
  })
  .catch(error => dispatch({ type: REFRESH_FEED_SUCCESS }));
};

const removeFeedItem = (item) => {
  return dispatch => {
    api.deleteFeedItem(item)
      .then(() => dispatch({
        type: DELETE_FEED_ITEM,
        item
      }))
      .catch(error => console.log('Error when trying to delete feed item', error));
  };
};

const reportFeedItem = (item) => {
  const body = {
    feedItemId: item.id,
    reportCreatorUuid: USER_UUID,
    reportDescription: 'Reported' // Currently no UI to give description
  }
  return dispatch => {
    api.reportItem(body)
      .then(() => {
        dispatch({ type: SHOW_NOTIFICATION, payload: NotificationMessages.getReportMessage() });
        setTimeout(() => {
          dispatch({ type: HIDE_NOTIFICATION });
          }, 3000);
      })
      .catch(error => console.log('Failed to report item', error));
  }
}

const removeItemAsAdmin = (item, isBan) => {
  return dispatch => {
    api.adminDelete(item)
      .then(() => dispatch({
        type: DELETE_FEED_ITEM,
        item
      }))
      .catch(error => {
        console.log('Error when trying to delete feed item as admin', error);
        if (error.response.status == '401') {
          dispatch({
            type: SHOW_NOTIFICATION,
            payload: NotificationMessages.getUnauthorizedMessage()
          });
          // Change UI render to normal so it is possible to login again
          dispatch({ type: LOGOUT });
          AsyncStorage.setItem(modKey, '');
        } else if (error.response.status == '404') {
          dispatch({
            type: SHOW_NOTIFICATION,
            payload: NotificationMessages.getUnableToFindMessage()
          });
        } else {
          dispatch({
            type: SHOW_NOTIFICATION,
            payload: NotificationMessages.getErrorMessage()
          });
        }
        setTimeout(() => {
          dispatch({ type: HIDE_NOTIFICATION });
        }, 6000);
      });
    if (isBan) {
      api.shadowBan(item)
      .catch(error => console.log('Error with shadow ban', error));
    }
  };
}

const voteFeedItem = (feedItemId, value) => (dispatch, getState) => {
  const state = getState();
  const list = getAllPostsInStore(state);
  const voteItem = list.find((item) => item.get('id') === feedItemId);

  if (!voteItem) {
    return;
  }


  //  userVote needs to be updated
  //  votevalue for item need to be calculated
  //    * if user had no previous vote, just sum given vote to vote values
  //    * if user had voted before, vote changes total value by +/-2
  const votes = voteItem.get('votes');
  const userVote = voteItem.get('userVote');

  const wasAlreadyVotedByMe = userVote !== 0;
  const voteWasChanged = userVote !== value;
  const multiplier = wasAlreadyVotedByMe ? 2 : 1;
  const difference = voteWasChanged ? (value * multiplier) : 0;

  const newVotes = parseInt(votes) + difference;

  // Naive update before request starts
  dispatch({
    type: VOTE_FEED_ITEM_REQUEST,
    value,
    feedItemId,
    votes: newVotes
  });


  // Do actual API call for vote
  const vote = { value, feedItemId };
  api.voteFeedItem(vote)
  .then(() => dispatch({
    type: VOTE_FEED_ITEM_SUCCESS,
    difference,
    feedItemId
  }))
  .catch(error => console.log('Error when trying to vote feed item', error));
}

// Open image in Lightbox
const OPEN_LIGHTBOX = 'OPEN_LIGHTBOX';
const CLOSE_LIGHTBOX = 'CLOSE_LIGHTBOX';
const openLightBox = (itemId) => ({ type: OPEN_LIGHTBOX, payload: itemId })

const closeLightBox = () => {
  return { type: CLOSE_LIGHTBOX };
};

export {
  SET_FEED,
  APPEND_FEED,
  GET_FEED_REQUEST,
  GET_FEED_SUCCESS,
  VOTE_FEED_ITEM_REQUEST,
  VOTE_FEED_ITEM_SUCCESS,
  GET_FEED_FAILURE,
  REFRESH_FEED_REQUEST,
  REFRESH_FEED_SUCCESS,
  DELETE_FEED_ITEM,
  OPEN_LIGHTBOX,
  CLOSE_LIGHTBOX,

  fetchFeed,
  refreshFeed,
  loadMoreItems,
  removeFeedItem,
  reportFeedItem,
  removeItemAsAdmin,
  voteFeedItem,
  openLightBox,
  closeLightBox
};
