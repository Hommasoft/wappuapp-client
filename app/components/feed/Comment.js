import React, { Component } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform } from 'react-native';

import time from '../../utils/time';
import theme from '../../style/theme';

const IOS = Platform.OS === 'ios';

class Comment extends Component {

  render() {

    return (
        <View style={styles.commentContainer}>
          <View style={styles.commentItem}>
          {this.props.type ?
            <View>
              <TouchableOpacity activeOpacity={IOS ? 0.7 : 1} style={styles.feedItemListItemInfo}>
                <View style={styles.feedItemListItemAuthor}>
                  <Text style={styles.itemAuthorName}>{"User"}</Text>
                  <Text style={styles.itemAuthorTeam}>{"Team"}</Text>
                </View>
                <Text style={styles.itemTimestamp}>{"Time"}</Text>
              </TouchableOpacity>
              <Text style={styles.feedItemListText}>{this.props.msg}</Text>
            </View>
          :
            <TouchableOpacity activeOpacity={IOS ? 0.7 : 1} >
              <Text style={styles.newCommentText}>{"Add new comment"}</Text>
            </TouchableOpacity>
          }
          </View>
        </View>
    );
  }
};

const styles = StyleSheet.create({
  commentContainer: {
    flex: 1,
    backgroundColor: '#ecebdf',
    marginTop: 10,
    marginLeft: 30,
    marginRight: 5,

    borderRadius: 5,
    // overflow: 'hidden',
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
  },
  commentItem: {
    flex: 1,
    //backgroundColor: '#AACC00',
    marginTop: 10,
  },
  feedItemListText: {
    textAlign: 'center',
    fontSize: 17,
    lineHeight: 25,
    color: theme.dark
  },
  feedItemListItemInfo: {
    flex: 1,
    flexDirection: 'row',
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
  itemTimestamp: {
    top:  IOS ? 1 : 2,
    color: '#aaa',
    fontSize: 11,
  },
  newCommentText: {
    textAlign: 'center',
    fontSize: 17,
    lineHeight: 25,
    color: theme.primary,
    fontStyle: "italic",
  },
});


export default Comment;
