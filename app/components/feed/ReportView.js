'use strict';

import React, { Component } from 'react';
import { View, StyleSheet, Modal, TextInput, Button } from 'react-native';
import { connect } from 'react-redux';

import { closeReportView, reportFeedItem } from '../../actions/feed';

import theme from '../../style/theme';

class ReportView extends Component {
  constructor(props) {
    super(props);
    this.state = { isVisible: false };
  }

  componentWillReceiveProps({ isReportVisible }) {
    if (isReportVisible != this.state.isVisible) {
      this.setState({ isVisible: isReportVisible });
    }
  }

  onCloseModal() {
    this.props.closeReportView();
  }

  onChangeText(text) {
    this.setState({ desc: text });
  }

  onSendText() {
    if (this.state.desc) {
      this.props.reportFeedItem(this.props.item, this.state.desc)
      this.props.closeReportView();
    }
  }

  render() {
    return (
      <View style={{ backgroundColor:theme.primary }}>
        <Modal
          onRequestClose={this.onCloseModal.bind(this)}
          visible={this.state.isVisible}
          animationType={'slide'}>
          <View style={styles.modalContainer}>
            <TextInput
              autoFocus={true}
              multiline={true}
              autoCapitalize={'sentences'}
              underlineColorAndroid={'transparent'}
              clearButtonMode={'while-editing'}
              returnKeyType={'send'}
              blurOnSubmit={true}
              onSubmitEditing={this.onSendText.bind(this)}
              style={styles.inputField}
              onChangeText={this.onChangeText.bind(this)}
              maxLength={151}
              placeholder='Give a description for the report'
              placeholderTextColor='#222'
              value={this.state.commentText}/>
            <View style={styles.buttons}>
              <Button
                onPress={this.onCloseModal.bind(this)}
                style={styles.button}
                title={"Cancel"}>
              </Button>
              <Button
                onPress={this.onSendText.bind(this)}
                style={styles.button}
                title={"Send Report"}>
              </Button>
            </View>
          </View>
        </Modal>
      </View>
    )
  }
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor:theme.primary,
    flex: 1,
    flexDirection: 'column',
    paddingLeft: 50,
    paddingRight: 50,
    paddingTop: 70
  },
  buttons: {
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  button: {
    color: theme.secondary
  },
  inputField: {
    padding: 5,
    fontSize: 16,
    color:'#000',
    textAlign: 'left',
    height: 100
  }
});

const select = store => {
  return {
    isReportVisible: store.feed.get('reportViewVisible'),
    item: store.feed.get('reportItem')
  };
};

const mapDispatchToProps = { closeReportView, reportFeedItem };

export default connect(select, mapDispatchToProps)(ReportView);
