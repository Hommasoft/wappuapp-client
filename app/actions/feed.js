import api from '../services/api';
import {createRequestActionTypes} from '.';
import { getCityId } from '../concepts/city';
import { getFeedSortType } from '../concepts/sortType';
import { getAllPostsInStore } from '../reducers/feed';

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

const COMMENT_SIZE = 'COMMENT_SIZE';


const fetchFeed = () => (dispatch, getState) => {
  dispatch(closedComments());
  const cityId = getCityId(getState());
  const sort = getFeedSortType(getState());

  if (!cityId) {
    return;
  }

  dispatch({ type: GET_FEED_REQUEST });
  return api.fetchModels('feed', { cityId, sort})
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
    dispatch({ type: LOAD_COMMENTS_SUCCESS });
  })
  .catch(error => dispatch({ type: LOAD_COMMENTS_FAILURE }));
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

const COMMENTS_CLOSED = 'COMMENTS_CLOSED';
const closedComments = () => {
  return { type: COMMENTS_CLOSED };
}

const storeClosedCommentViewSize = (size) => {
  return { type: COMMENT_SIZE, payload: size }
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
  LOAD_COMMENTS_REQUEST,
  LOAD_COMMENTS_SUCCESS,
  LOAD_COMMENTS_FAILURE,
  DELETE_FEED_ITEM,
  OPEN_LIGHTBOX,
  CLOSE_LIGHTBOX,
  COMMENTS_CLOSED,
  COMMENT_SIZE,

  fetchFeed,
  refreshFeed,
  loadMoreItems,
  loadComments,
  removeFeedItem,
  voteFeedItem,
  openLightBox,
  closeLightBox,
  closedComments,
  storeClosedCommentViewSize
};
