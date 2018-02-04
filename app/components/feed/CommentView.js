import React, { Component } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform, ListView, TextInput, Keyboard } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import theme from '../../style/theme';
import LoadingStates from '../../constants/LoadingStates';
import time from '../../utils/time';

const IOS = Platform.OS === 'ios';

class CommentView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dataSource: new ListView.DataSource({ rowHasChanged: (row1, row2) => row1 !== row2 }),
      commentText: ''
    };
  }

  componentWillReceiveProps({ commentList, commentListState }) {
    if (commentList !== this.props.commentList) {
      this.setState({
        dataSource: this.state.dataSource.cloneWithRows(commentList)
      });
    }
  }

  checkInputPosition() {
    this.refs._input.measure((w, h, px, py, fx, fy) => {
      this.props.setInputReqPos(fy);
    })
  }

  onSendText() {
    if (!this.state.commentText.length) {
      return;
    }
    this.props.onSendComment(this.state.commentText);
    this.setState({commentText: ''});
    Keyboard.dismiss();
  }

  onChangeText(text) {
    this.setState({commentText: text});
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
                    <TouchableOpacity
                      activeOpacity={1}
                      onLongPress={() => { this.props.showRemoveDialog(item)} }>
                      <Text style={styles.commentText}>{item.text}</Text>
                    </TouchableOpacity>
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
                <View style={styles.inputContainer}>
                  <TextInput
                    ref='_input'
                    autoFocus={false}
                    multiline={true}
                    onFocus={this.checkInputPosition.bind(this)}
                    autoCapitalize={'sentences'}
                    underlineColorAndroid={'transparent'}
                    clearButtonMode={'while-editing'}
                    returnKeyType={'send'}
                    blurOnSubmit={true}
                    onSubmitEditing={this.onSendText.bind(this)}
                    style={styles.inputField}
                    onChangeText={this.onChangeText.bind(this)}
                    maxLength={151}
                    placeholder="Write a new comment ..."
                    placeholderTextColor={'#888'}
                    value={this.state.commentText} />
                  <Icon name={'arrow-forward'} size={22} style={styles.sendIcon} onPress={() => this.onSendText()}/>
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
  inputContainer: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
    borderRadius: 4
  },
  inputField: {
    textAlignVertical: 'top',
    flex: 1,
    fontSize: 14,
    textAlign: 'left',
    height: 56,
    paddingLeft: 6

  },
  sendIcon: {
    color: theme.primary
  },
});


export default CommentView;
