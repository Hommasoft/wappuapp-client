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

const SET_COMMENTS = 'SET_COMMENTS';
const APPEND_COMMENTS = 'APPEND_COMMENTS';
const UPDATE_COMMENT_COUNT = 'UPDATE_COMMENT_COUNT';

const {
  LOAD_COMMENTS_REQUEST,
  LOAD_COMMENTS_SUCCESS,
  LOAD_COMMENTS_FAILURE
} = createRequestActionTypes('LOAD_COMMENTS');

const DELETE_FEED_ITEM = 'DELETE_FEED_ITEM';

const {
  VOTE_FEED_ITEM_REQUEST,
  VOTE_FEED_ITEM_SUCCESS,
} = createRequestActionTypes('VOTE_FEED_ITEM');


const fetchFeed = () => (dispatch, getState) => {
  dispatch(closedComments());
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
  dispatch(closedComments());
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
  // Changing isRefreshing status while loading more feed, makes feed jump abnormaly
  //dispatch({ type: REFRESH_FEED_REQUEST });
  const cityId = getCityId(getState());
  const sort = getFeedSortType(getState());
  return api.fetchMoreFeed(lastID, { cityId, sort })
  .then(items => {
    dispatch({
      type: APPEND_FEED,
      feed: items
    });
    //dispatch({ type: REFRESH_FEED_SUCCESS });
    dispatch({ type: GET_FEED_SUCCESS });
  })
  //.catch(error => dispatch({ type: REFRESH_FEED_SUCCESS }));
};

const loadComments = (parent_id, offset) => (dispatch, getState) => {
  // Don't change state when there are old comments in the feed to prevent feed from jumping
  if (offset == 0) {
    dispatch({
      type: LOAD_COMMENTS_REQUEST,
      parentId: parent_id
     });
  }
  return api.fetchComments(parent_id, offset, {})
  .then(items => {
    if (offset > 0) {
      dispatch({
        type: APPEND_COMMENTS,
        comment: items
      });
    } else {
      dispatch({
        type: SET_COMMENTS,
        comment: items
      });
    }
    dispatch(updateCommentCount(parent_id));
    dispatch({ type: LOAD_COMMENTS_SUCCESS });
  })
  .catch(error => dispatch({ type: LOAD_COMMENTS_FAILURE }));
};

const updateCommentCount = parent_id => (dispatch, getState) => {
  return api.refreshCommentCount(parent_id)
  .then(response => {
    dispatch({
      type: UPDATE_COMMENT_COUNT,
      id: parent_id,
      value: response
    });
  })
}

const removeFeedItem = (item) => {
  return dispatch => {
    api.deleteFeedItem(item)
      .then(() => {
        dispatch({
          type: DELETE_FEED_ITEM,
          item
        });
        // Update comment counter if deleted item was a comment
        if (item.parent_id) {
          dispatch(updateCommentCount(item.parent_id));
        }
      })
      .catch(error => console.log('Error when trying to delete feed item', error));
  };
};

const reportFeedItem = (item, desc) => {
  const body = {
    feedItemId: item.toJS().id,
    reportCreatorUuid: USER_UUID,
    reportDescription: desc
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
      .then(() => {
        dispatch({
          type: DELETE_FEED_ITEM,
          item
        });
        // Update comment counter if deleted item was a comment
        if (item.parent_id) {
          dispatch(updateCommentCount(item.parent_id));
        }
      })
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

const OPEN_REPORT_VIEW = 'OPEN_REPORT_VIEW';
const CLOSE_REPORT_VIEW = 'CLOSE_REPORT_VIEW';

const openReportView = (item) => {
  return { type: OPEN_REPORT_VIEW, payload: item };
}

const closeReportView = () => {
  return { type: CLOSE_REPORT_VIEW }
}

const COMMENTS_CLOSED = 'COMMENTS_CLOSED';
const closedComments = () => {
  return { type: COMMENTS_CLOSED };
}

const COMMENT_SIZE = 'COMMENT_SIZE';
const storeClosedCommentViewSize = (size) => {
  return { type: COMMENT_SIZE, payload: size }
}

const SET_INPUT_POS = 'SET_INPUT_POS';
const setInputReqPos = (pos) => {
  return { type: SET_INPUT_POS, payload: pos }
}


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
  SET_COMMENTS,
  APPEND_COMMENTS,
  UPDATE_COMMENT_COUNT,
  LOAD_COMMENTS_REQUEST,
  LOAD_COMMENTS_SUCCESS,
  LOAD_COMMENTS_FAILURE,
  DELETE_FEED_ITEM,
  OPEN_LIGHTBOX,
  CLOSE_LIGHTBOX,
  OPEN_REPORT_VIEW,
  CLOSE_REPORT_VIEW,
  COMMENTS_CLOSED,
  COMMENT_SIZE,
  SET_INPUT_POS,

  fetchFeed,
  refreshFeed,
  loadMoreItems,
  loadComments,
  updateCommentCount,
  removeFeedItem,
  reportFeedItem,
  removeItemAsAdmin,
  voteFeedItem,
  openLightBox,
  closeLightBox,
  openReportView,
  closeReportView,
  closedComments,
  storeClosedCommentViewSize,
  setInputReqPos
};
