'use strict';

import React, { Component } from 'react';
import { View, StyleSheet, Dimensions, Text, Modal, TextInput, Button, ActivityIndicator } from 'react-native';
import { connect } from 'react-redux';
import autobind from 'autobind-decorator';

import { loginModerator, closeLoginView } from '../../actions/registration';

import LoginStates from '../../constants/LoginStates';

import theme from '../../style/theme';

const { height, width } = Dimensions.get('window');

class UserView extends Component {
  constructor(props) {
    super(props);
    this.state = { isVisible: false, email: '', password: '', status: LoginStates.NONE };
  }

  componentWillReceiveProps({ isLoginVisible, loginStatus }) {
    if (isLoginVisible != this.state.isVisible) {
      this.setState({ isVisible: isLoginVisible });
    }
    if (loginStatus != this.state.status) {
      this.setState({ status: loginStatus });
    }
  }

  @autobind
  onChangeEmail(text) {
    this.setState({ email: text });
  }

  @autobind
  onChangePassword(text) {
    this.setState({ password: text });
  }

  @autobind
  onCancel() {
    this.setState({ email: '' });
    this.setState({ password: '' });
    this.props.closeLoginView();
  }

  @autobind
  onLogin() {
    if (this.state.email && this.state.password) {
      this.props.loginModerator(this.state.email, this.state.password);
    }
  }

  renderForm(message) {
    return (
      <View>
        <View style={styles.info}>
          <Text style={styles.infoText}>{message}</Text>
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            autoCapitalize={'none'}
            autoFocus={false}
            multiline={false}
            clearButtonMode={'while-editing'}
            returnKeyType={'send'}
            blurOnSubmit={true}
            style={styles.inputField}
            onChangeText={this.onChangeEmail}
            numberOfLines={1}
            placeholderTextColor={'#000'}
            placeholder="Email"
            value={this.state.email}/>
          <TextInput
            secureTextEntry={true}
            autoFocus={false}
            multiline={false}
            clearButtonMode={'while-editing'}
            returnKeyType={'send'}
            blurOnSubmit={true}
            style={styles.inputField}
            onChangeText={this.onChangePassword}
            numberOfLines={1}
            placeholderTextColor={'#000'}
            placeholder="Password"
            value={this.state.password} />
        </View>
        <View style={styles.buttons}>
          <Button
            onPress={this.onCancel}
            style={styles.cancelButton}
            title={"Cancel"}>
          </Button>
          <Button
            onPress={this.onLogin}
            style={styles.loginButton}
            title={"Login"}>
          </Button>
        </View>
      </View>
    );
  }

  renderModalContent() {
    switch (this.state.status) {
      case LoginStates.AUTHENTICATING:
        return  (
          <View style={styles.info}>
            <ActivityIndicator
                color={theme.primary}
                animating={true}
                style={styles.activity}
                size='large' />
            <Text style={ styles.infoText}>Authenticating...</Text>
          </View>
        );
      case LoginStates.FAILED:
        return (
          <View>
            {this.renderForm('Failed to login')}
          </View>
        );
      case LoginStates.SUCCESS:
        return  (
          <View>
            <View style={styles.info}>
              <Text style={styles.infoText}>You are logged in as moderator</Text>
            </View>
            <View style={styles.buttons}>
              <Button
                onPress={this.onCancel}
                style={styles.cancelButton}
                title={"Ok"}>
              </Button>
            </View>
          </View>
        );
      default:
        return (
          <View>
            {this.renderForm('Login as moderator')}
          </View>
        );
    }
  }

  render() {
    return (
      <View style={{ backgroundColor:theme.secondary }}>
        <Modal
          onRequestClose={this.onCancel}
          visible={this.state.isVisible}
          animationType={'slide'}>
          {this.props.isModerator ?
            <View>
              <View style={styles.info}>
                <Text style={styles.infoText}>You are logged in as moderator</Text>
              </View>
              <View style={styles.buttons}>
                <Button
                  onPress={this.onCancel}
                  style={styles.cancelButton}
                  title={"Ok"}>
                </Button>
              </View>
            </View>
          :
            this.renderModalContent()
          }
        </Modal>
      </View>
    );
  }
};


const styles = StyleSheet.create({
  buttons:{
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 20,
    paddingBottom: 0,
    paddingLeft: 20,
    paddingRight: 20,
  },
  loginButton: {
    flex: 1,
    marginLeft: 10,
  },
  cancelButton: {
    flex: 1,
    marginRight: 10,
  },
  inputContainer: {
    marginTop: 10
  },
  inputField: {
    fontSize: 16,
    margin: 0,
    marginLeft: 40,
    marginTop: 30,
    color:'#000',
    textAlign: 'center',
    height: 30,
    width: width - 80,
    borderRadius: 8,
    backgroundColor: '#ddd'
  },
  info: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 110
  },
  infoText: {
    fontSize: 22,
  },
  activity: {
    marginTop: 0.1 * height,
    paddingBottom: 20,
  },
});

const select = store => {
  return {
    isLoginVisible: store.registration.get('isLoginVisible'),
    loginStatus: store.registration.get('loginStatus'),
    isModerator: store.registration.get('isModerator')
  };
};

const mapDispatchToProps = { closeLoginView, loginModerator };

export default connect(select, mapDispatchToProps)(UserView);
