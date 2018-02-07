'use strict';
import Immutable from 'immutable';
import { createSelector } from 'reselect';
import { isNil } from 'lodash';

import {
  SET_FEED,
  APPEND_FEED,
  GET_FEED_REQUEST,
  GET_FEED_SUCCESS,
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
  VOTE_FEED_ITEM_REQUEST,
  CLOSE_LIGHTBOX,
  OPEN_REPORT_VIEW,
  CLOSE_REPORT_VIEW,
  COMMENTS_CLOSED,
  COMMENT_SIZE,
  SET_INPUT_POS
} from '../actions/feed';
import { getUserImages } from '../concepts/user';
import { getEventImages } from './event';
import LoadingStates from '../constants/LoadingStates';

// # Selectors
export const getFeed = state => state.feed.get('list') || Immutable.List([]);
export const getLightBoxItemId = state => state.feed.get('lightBoxItemId', null);

export const getAllPostsInStore = createSelector(
  getFeed, getUserImages, getEventImages,
  (feedList, userImages, eventImages) => feedList.concat(userImages, eventImages)
);

export const getLightboxItem = createSelector(
  getLightBoxItemId, getAllPostsInStore,
  (id, posts) => {

    if (isNil(id)) {
      return Immutable.Map();
    }

    return posts.find((item) => item.get('id') === id);
  }
);


// # Reducer
const initialState = Immutable.fromJS({
  list: [],
  comments: [], // Open comments in the client
  openCommentId: null,  // parentId of the open comments
  listState: LoadingStates.NONE,
  commentState: LoadingStates.NONE,
  isRefreshing: false,
  lightBoxItem: {},
  lightBoxItemId: {},
  isLightBoxOpen: false,
  closedCommentsSize: 0,
  inputPos: 0,
  reportViewVisible: false,
  reportItem: {}
});

export default function feed(state = initialState, action) {
  switch (action.type) {
    case SET_FEED:
      return state.set('list', Immutable.fromJS(action.feed));
    case APPEND_FEED:
      return (action.feed && action.feed.length) ?
        state.set('list', Immutable.fromJS(state.get('list')
          .concat(Immutable.fromJS(action.feed)))) :
        state;
    case GET_FEED_REQUEST:
      return state.set('listState', LoadingStates.LOADING);
    case GET_FEED_SUCCESS:
      return state.set('listState', LoadingStates.READY);
    case GET_FEED_FAILURE:
      return state.set('listState', LoadingStates.FAILED);
    case REFRESH_FEED_REQUEST:
      return state.set('isRefreshing', true);
    case REFRESH_FEED_SUCCESS:
      return state.set('isRefreshing', false);
    case SET_COMMENTS:
      return state.set('comments', Immutable.fromJS(action.comment));
    case APPEND_COMMENTS:
      return (action.comment && action.comment.length) ?
        state.set('comments', Immutable.fromJS(state.get('comments')
          .concat(Immutable.fromJS(action.comment)))) :
        state;
    case UPDATE_COMMENT_COUNT:
      const oList = state.get('list');
      const iIndex = oList.findIndex((item) => item.get('id') == action.id);

      if (iIndex < 0) {
        console.log('Cannot find item from state:', iIndex);
        return state;
      } else {
        return state.set('list', oList.setIn([iIndex, 'numberOfComments'], action.value))
      }
    case LOAD_COMMENTS_REQUEST:
      return state.merge({
        'commentState': LoadingStates.LOADING,
        'openCommentId': action.parentId
      });
    case LOAD_COMMENTS_SUCCESS:
      return state.set('commentState', LoadingStates.READY);
    case LOAD_COMMENTS_FAILURE:
      return state.set('commentState', LoadingStates.FAILED);
    case DELETE_FEED_ITEM:
      const originalList = state.get('list');
      const itemIndex = originalList.findIndex((item) => item.get('id') === action.item.id);

      if (itemIndex < 0) {
        // Check if deleted item was comment
        const originalCommentList = state.get('comments');
        itemIndex = originalCommentList.findIndex((item) => item.get('id') === action.item.id);

        if (itemIndex < 0) {
          console.log('Tried to delete item, but it was not found from state:', itemIndex);
          return state;
        } else {
          return state.set('comments', originalCommentList.delete(itemIndex));
        }
      } else {
        return state.set('list', originalList.delete(itemIndex));
      }

    case VOTE_FEED_ITEM_REQUEST: {
      const list = state.get('list');
      const voteItemIndex = list.findIndex((item) => item.get('id') === action.feedItemId);
      if (voteItemIndex < 0) {
        console.log('Tried to vote item, but it was not found from state:', voteItemIndex);
        return state;
      } else {
        return state.mergeIn(['list', voteItemIndex], {
          'userVote': action.value,
          'votes': action.votes
        });
      }
    }

    case OPEN_LIGHTBOX:
      return state.merge({
        isLightBoxOpen: true,
        lightBoxItemId: action.payload
      });

    case CLOSE_LIGHTBOX:
      return state.merge({
        isLightBoxOpen: false,
        lightBoxItemId: null,
      });

    case COMMENTS_CLOSED:
      return state.merge({
        openCommentId: null,
        commentState: LoadingStates.NONE,
        comments: []
      });

    case OPEN_REPORT_VIEW:
      return state.merge({reportViewVisible: true, reportItem: action.payload});

    case CLOSE_REPORT_VIEW:
      return state.set('reportViewVisible', false);

    case COMMENT_SIZE:
      return state.set('closedCommentsSize', action.payload);

    case SET_INPUT_POS:
      return state.set('inputPos', action.payload);

    default:
      return state;
  }
}
