import React, { Component } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform, ListView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import theme from '../../style/theme';
import LoadingStates from '../../constants/LoadingStates';
import time from '../../utils/time';

const IOS = Platform.OS === 'ios';

class CommentView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dataSource: new ListView.DataSource({ rowHasChanged: (row1, row2) => row1 !== row2 })
    };
  }

  componentWillReceiveProps({ commentList, commentListState }) {
    if (commentList !== this.props.commentList) {
      this.setState({
        dataSource: this.state.dataSource.cloneWithRows(commentList)
      });
    }
  }

  renderComments() {
    switch (this.props.commentListState) {
      case LoadingStates.LOADING:
        return (
          <View style={styles.commentContainer}>
            <View style={styles.commentItem}>
              <Text>Loading comments ...</Text>
            </View>
          </View>
        );
      case LoadingStates.FAILED:
        return (
          <View style={styles.commentContainer}>
            <View style={styles.commentItem}>
              <Text>Failed to load comments :(</Text>
            </View>
          </View>
        );
      default:
        return (
          <View style={styles.commentContainer}>
            {(this.props.commentList.length > 0) ?
              <ListView
                dataSource={this.state.dataSource}
                renderRow={item =>
                  <View style={styles.commentItem}>
                    <TouchableOpacity activeOpacity={IOS ? 0.7 : 1} onPress={() => this.props.openUserPhotos(item.author)}>
                        <Text style={styles.itemAuthorName}>{item.author.name}</Text>
                    </TouchableOpacity>
                    <Text style={styles.commentText}>{item.text}</Text>
                  </View>
                }
              />
            : <View></View>
            }
            <View style={styles.bottomCommentItem}>
              {(this.props.commentCount > this.props.commentList.length) ?
                <View style={styles.moreCommentContainer}>
                  <TouchableOpacity activeOpacity={IOS ? 0.7 : 1} onPress={() => this.props.loadComments(this.props.parentId, this.props.commentList.length)}>
                    <Text style={styles.moreCommentsText}>{'More comments'}
                    </Text>
                  </TouchableOpacity>
                </View>
              :
                <View>
                  <TouchableOpacity activeOpacity={IOS ? 0.7 : 1} onPress={() => this.props.onPressAction('COMMENT')}>
                    <Icon name={'add'} size={20} style={[styles.newCommentIcon]}></Icon>
                  </TouchableOpacity>
                </View>
              }
            </View>
          </View>
        );
    }
  }

  render() {
    return (
      <View>
        {this.renderComments()}
      </View>
    );
  }
};

const styles = StyleSheet.create({
  commentContainer: {
    backgroundColor: '#ffffff',
    marginTop: 10,
    marginLeft: 30,
    marginRight: 5,
    borderRadius: 5,
    borderBottomWidth: IOS ? 0 : 1,
    borderBottomColor: 'rgba(0, 0, 0, .075)',
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 1,
    shadowOffset: {
      height: 2,
      width: 1
    },
    paddingBottom: 10,
    flexDirection: 'column'
  },
  commentItem: {
    flexDirection: 'column',
    marginTop: 8,
    marginLeft: 8,
    marginRight: 8,
    borderBottomColor: 'grey',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 4
  },
  commentText: {
    textAlign: 'left',
    fontSize: 13,
    color: theme.dark,
    alignItems: 'flex-start',
    flexWrap: 'wrap'
  },
  itemAuthorName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.secondary,
    marginRight: 8
  },
  bottomCommentItem: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    marginLeft: 8,
    marginRight: 8
  },
  moreCommentContainer: {
    flexDirection: 'row',
    justifyContent: 'center'
  },
  moreCommentsText: {
    color: theme.primary,
    fontStyle: 'italic'
  },
  newCommentIcon: {
    color: theme.primary,
    fontStyle: "italic"
  }
});


export default CommentView;
