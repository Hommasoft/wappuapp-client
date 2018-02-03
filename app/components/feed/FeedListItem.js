'use strict';

// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
import React, { Component } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Dimensions,
  Text,
  Platform,
  PropTypes,
  TouchableOpacity,
  View
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialIcons';

import { connect } from 'react-redux';
import abuse from '../../services/abuse';
import time from '../../utils/time';
import theme from '../../style/theme';
import { openRegistrationView } from '../../actions/registration';
import VotePanel from './VotePanel';
import CommentView from './CommentView';
import { loadComments, closedComments, storeClosedCommentViewSize } from '../../actions/feed';

const { width } = Dimensions.get('window');
const FEED_ITEM_MARGIN_DISTANCE = 0;
const FEED_ITEM_MARGIN_DEFAULT = 0;
const FEED_ADMIN_ITEM_MARGIN_DEFAULT = 15;
const IOS = Platform.OS === 'ios';

const styles = StyleSheet.create({
  itemWrapper: {
    width,
    flex: 1,
    backgroundColor: '#f2f2f2',
    paddingBottom: 10,
    paddingTop: 0,
  },
  itemTouchable: {
    elevation: 1,
    flexGrow: 1,
  },
  itemContent:{
    flexGrow: 1,
    marginLeft: FEED_ITEM_MARGIN_DEFAULT,
    marginRight: FEED_ITEM_MARGIN_DISTANCE,
    borderRadius: 0,
    // overflow: 'hidden',
    borderBottomWidth: IOS ? 0 : 1,
    borderBottomColor: 'rgba(0, 0, 0, .075)',
    // // # Drop shadows
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.075,
    shadowRadius: 1,
    shadowOffset: {
      height: 2,
      width: 0
    },
    backgroundColor: '#fff'
  },
  itemContent_selected: {
    backgroundColor: theme.stable
  },
  itemContent_byMyTeam: {
    marginRight: FEED_ITEM_MARGIN_DEFAULT,
    marginLeft: FEED_ITEM_MARGIN_DISTANCE,
    // backgroundColor: '#edfcfb',
  },

  itemContent_image: {
    marginLeft: FEED_ITEM_MARGIN_DEFAULT,
    marginRight: FEED_ITEM_MARGIN_DEFAULT,
    borderRadius: 0,
  },
  itemImageWrapper: {
    width: width - (2 * FEED_ITEM_MARGIN_DEFAULT),
    height: width - (2 * FEED_ITEM_MARGIN_DEFAULT),
    // borderBottomLeftRadius: 20,
    // borderBottomRightRadius: 20,
    overflow: 'hidden'
  },
  itemTextWrapper: {
    paddingLeft: 30,
    paddingRight: 30,
    paddingTop: 16,
    paddingBottom: 12,
    top: -10,
  },
  feedItemListText: {
    textAlign: 'center',
    fontSize: 17,
    lineHeight: 25,
    color: theme.dark
  },
  feedItemListItemImg: {
    width: width - (2 * FEED_ITEM_MARGIN_DEFAULT),
    height: width - (2 * FEED_ITEM_MARGIN_DEFAULT),
    backgroundColor: 'transparent',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,

  },
  feedItemListItemImg__admin: {
    width: width - (2 * FEED_ADMIN_ITEM_MARGIN_DEFAULT),
    borderRadius: 5,
  },
  feedItemListItemInfo: {
    flex: 1,
    flexDirection: 'row',
    padding: 13,
    paddingTop: 13,
    paddingLeft: 15,
    paddingRight: 15,
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  feedItemListItemAuthor:{
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start'
  },
  itemAuthorName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.secondary,
    paddingRight: 10
  },
  itemAuthorTeam:{
    fontSize:11,
    color: '#aaa'
  },
  itemAuthorTeam__my: {
    color: theme.primary,
    fontWeight: 'bold'
  },
  feedItemListItemAuthorIcon:{
    color: '#bbb',
    fontSize: 15,
    marginTop: 1,
    paddingRight: 10
  },
  listItemRemoveButton:{
    backgroundColor: 'transparent',
    color: 'rgba(150,150,150,.65)',
    fontSize: IOS ? 22 : 20,
  },
  listItemRemoveContainer: {
    position: 'absolute',
    right: 8,
    bottom: 10,
    borderRadius: 15,
    width: 30,
    height: 30,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  itemTimestamp: {
    top:  IOS ? 1 : 2,
    color: '#aaa',
    fontSize: 11,
  },
  itemContent__admin:{
    marginLeft: 15,
    marginRight: 15,
    paddingTop: 0,
    paddingBottom: 0,
    borderRadius: 2,
    backgroundColor: '#faf5ee'
  },
  itemTextWrapper__admin: {
    paddingTop: 0,
    paddingBottom: 5,
    paddingLeft: 15,
    paddingRight: 15
  },
  feedItemListItemInfo__admin: {
    paddingLeft: 0,
    paddingBottom: 14,
  },
  feedItemListItemAuthor__admin:  {
    paddingLeft: 15,
  },
  itemTimestamp__admin:{
    color: '#b5afa6'
  },
  feedItemListText__admin: {
    textAlign: 'left',
    color: '#7d776e',
    fontWeight: 'bold',
    fontSize: 12,
    lineHeight: 19,
  },
  feedItemBottomWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingTop: 5
  },
  commentAmountItemWrapper: {
    paddingRight: 15,
    paddingBottom: 9,
    alignSelf: "flex-end",
    flexDirection: 'row'
  },
  commentListWrapper: {
    backgroundColor: theme.lightgrey,
    flexDirection: 'column',
  },
  commentIcon: {
    color: theme.primary,
  },
  IconNumberStyle: {
    position:'absolute',
    right:3,
    top:4,
    width:20,
    height:14,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    backgroundColor: theme.primary,
    color:'#000000',
    fontSize: 10
  },
});

class FeedListItem extends Component {
  propTypes: {
    item: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props);
    this.state = { selected: false,
      commentsVisible: false,
      commentHeight: 0 };
  }

  componentWillReceiveProps({ commentList, openCommentId }) {
    // Hide/Show comments if other comments are opened
    if (openCommentId !== parseInt(this.props.item.id)) {
      // If commentView is closed, store size of it for adjusting feed
      if (this.state.commentsVisible && (openCommentId !== null) && (openCommentId < this.props.openCommentId)) {
        this.props.storeClosedCommentViewSize(this.state.commentHeight);
      }
      this.setState({ commentsVisible: false });
    }
    else {
      this.setState({ commentsVisible: true });
    }
  }

  calcSize(event) {
    this.setState({ commentHeight: event.nativeEvent.layout.height });
  }

  itemIsCreatedByMe(item) {
    return item.author.type === 'ME';
  }


  itemIsCreatedByMyTeam(item) {
    const { userTeam } = this.props;
    if (userTeam) {
      return item.author.team === userTeam.get('name');
    }
    return false;
  }

  selectItem() {
    this.setState({ selected: true });
    this.showRemoveDialog(this.props.item);
  }

  deSelectItem() {
    this.setState({ selected: false });
  }

  toogleComments() {
    if (this.state.commentsVisible) {
      this.props.closedComments();
    }
    else {
      this.props.loadComments(this.props.item.id, 0);
    }
  }

  showRemoveDialog(item) {
    if (this.itemIsCreatedByMe(item)) {
      Alert.alert(
        'Remove Content',
        'Do you want to remove this item?',
        [
          { text: 'Cancel',
            onPress: () => this.deSelectItem(), style: 'cancel' },
          { text: 'Yes, remove item',
            onPress: () => { this.deSelectItem(); this.removeItem(item) }, style: 'destructive' }
        ]
      );
    } else {
      Alert.alert(
        'Flag Content',
        'Do you want to report this item?',
        [
          { text: 'Cancel',
            onPress: () => this.deSelectItem() , style: 'cancel' },
          { text: 'Yes, report item',
            onPress: () => { this.deSelectItem(); abuse.reportFeedItem(item) }, style: 'destructive' }
        ]
      );
    }
  }

  removeItem(item) {
    this.props.removeFeedItem(item);
  }

  // Render "remove" button, which is remove OR flag button,
  // depending is the user the creator of this feed item or not
  renderRemoveButton(item) {
    if (item.author.type === 'SYSTEM') {

      return <View></View>; // currently it is not possible to return null in RN as a view
    }

    const iconName = this.itemIsCreatedByMe(item) ? 'delete' : 'flag';
    return (
      <TouchableOpacity
       style={[styles.listItemRemoveContainer,
         {backgroundColor:item.type !== 'IMAGE' ? 'transparent' : 'rgba(255,255,255,.1)'}]}
       onPress={() => this.showRemoveDialog(item)}>

        <Icon name={iconName} style={[styles.listItemRemoveButton,
          {opacity:item.type !== 'IMAGE' ? 0.7 : 1}]
        }/>

      </TouchableOpacity>
    );
  }

  renderAdminItem(item, ago) {

    return (
      <View style={styles.itemWrapper}>
        <View style={[styles.itemContent, styles.itemContent__admin]}>

          <View style={[styles.feedItemListItemInfo, styles.feedItemListItemInfo__admin]}>
            <View style={[styles.feedItemListItemAuthor, styles.feedItemListItemAuthor__admin]}>
              <Text style={styles.itemAuthorName}>Whappu</Text>
            </View>
            <Text style={[styles.itemTimestamp, styles.itemTimestamp__admin]}>{ago}</Text>
          </View>

          {item.type === 'IMAGE' ?
            <View style={styles.itemImageWrapper}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => this.props.openLightBox(item.id)}
              >
                <Image
                  source={{ uri: item.url }}
                  style={[styles.feedItemListItemImg, styles.feedItemListItemImg__admin]} />
              </TouchableOpacity>
            </View>
          :
            <View style={[styles.itemTextWrapper, styles.itemTextWrapper__admin]}>
              <Text style={[styles.feedItemListText, styles.feedItemListText__admin]}>
                {item.text}
              </Text>
            </View>
          }
        </View>
      </View>
    );
  }

  render() {
    const { item, openUserPhotos } = this.props;
    const { selected } = this.state;
    const ago = time.getTimeAgo(item.createdAt);

    if (item.author.type === 'SYSTEM') {
      return this.renderAdminItem(item, ago);
    }

    const itemByMyTeam = this.itemIsCreatedByMyTeam(item);
    const isItemImage = item.type === 'IMAGE';

    return (
      <View style={styles.itemWrapper}>
        <TouchableOpacity
          activeOpacity={1}
          style={styles.itemTouchable}
          onLongPress={() => this.selectItem() }
        >
        <View style={[styles.itemContent,
          itemByMyTeam ? styles.itemContent_byMyTeam : {},
          isItemImage ? styles.itemContent_image : {},
          selected ? styles.itemContent_selected : {}
        ]}>

          <TouchableOpacity activeOpacity={IOS ? 0.7 : 1} style={styles.feedItemListItemInfo} onPress={() => openUserPhotos(item.author)}>
            <View style={styles.feedItemListItemAuthor}>
              <Text style={styles.itemAuthorName}>{item.author.name}</Text>
              <Text style={[styles.itemAuthorTeam, itemByMyTeam ? styles.itemAuthorTeam__my : {}]}>{item.author.team}</Text>
            </View>
            <Text style={styles.itemTimestamp}>{ago}</Text>
          </TouchableOpacity>

          {isItemImage ?
            <View style={styles.itemImageWrapper}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => this.props.openLightBox(item.id)}
              >
                <Image
                  source={{ uri: item.url }}
                  style={styles.feedItemListItemImg} />
              </TouchableOpacity>
            </View>
          :
            <View style={styles.itemTextWrapper}>
              <Text style={styles.feedItemListText}>{item.text}</Text>
            </View>
          }
            <View style={styles.feedItemBottomWrapper}>

              <VotePanel
                item={item}
                voteFeedItem={this.props.voteFeedItem}
                openRegistrationView={this.props.openRegistrationView}
              />

              <View style={styles.commentAmountItemWrapper}>
                <TouchableOpacity onPress={() => this.toogleComments()}>
                  <Icon name={'mode-comment'} size={26} style={styles.commentIcon}></Icon>
                  <Text style={styles.IconNumberStyle}>{item.numberOfComments}</Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </TouchableOpacity>
        {this.state.commentsVisible ?
          <View style={styles.commentListWrapper} onLayout={(event) => this.calcSize(event)}>
            <CommentView
              parentId={this.props.item.id}
              commentList={this.props.commentList}
              commentListState={this.props.commentListState}
              commentCount={item.numberOfComments}
              loadComments={this.props.loadComments}
              onPressAction={this.props.onPressAction}
              openUserPhotos={this.props.openUserPhotos}
              showRemoveDialog={this.showRemoveDialog.bind(this)}/>
          </View>
          : <View></View>
        }
      </View>
    );
  }
}

const select = store => {
  return {
    actionTypes: store.competition.get('actionTypes'),
    commentList: store.feed.get('comments').toJS(),
    commentListState: store.feed.get('commentState'),
    openCommentId: parseInt(store.feed.get('openCommentId'))
  };
};
const mapDispatchToProps = { openRegistrationView, loadComments, closedComments, storeClosedCommentViewSize };

export default connect(select, mapDispatchToProps)(FeedListItem);
