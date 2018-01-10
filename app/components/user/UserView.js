'use strict';

import React, { Component } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity,
  TouchableHighlight, Image, Platform, Text, Modal, TextInput, Button } from 'react-native';
import { connect } from 'react-redux';
import autobind from 'autobind-decorator';

import {
  getUserImages,
  getUserTeam,
  getTotalSimas,
  getTotalVotesForUser,
  fetchUserImages,
  isLoadingUserImages,
} from '../../concepts/user';
import { getUserName, getUserId } from '../../reducers/registration';
import { openLightBox } from '../../actions/feed';

import ParallaxView from 'react-native-parallax-view';
import Icon from 'react-native-vector-icons/MaterialIcons';

import theme from '../../style/theme';
import Header from '../common/Header';
import Loader from '../common/Loader';

const headerImage = require('../../../assets/frontpage_header-bg.jpg');

const { height, width } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';

class UserView extends Component {
  constructor(props) {
    super(props);
    this.state = { pushCounter: 0, loginVisible: false, email: '', password: ''};
  }

  componentDidMount() {
    const { user } = this.props.route;
    const { userId } = this.props;

    if (user && user.id) {
      this.props.fetchUserImages(user.id);
    } else {
      this.props.fetchUserImages(userId);
    }
  }

  showAdminLogin() {
    if (this.props.route.isMe) {
      this.setState({pushCounter: this.state.pushCounter + 1});
      if (this.state.pushCounter === 10) {
        this.setState({loginVisible: true});
        this.setState({pushCounter: 0});
      }
    }
  }

  @autobind
  onChangeEmail(text) {
    this.setState({email: text});
  }

  @autobind
  onChangePassword(text) {
    this.setState({password: text});
  }

  @autobind
  onCancel() {
    //this.setState({text: ''});
    this.setState({loginVisible: false});
    this.setState({email: ''});
    this.setState({password: ''});
  }

  @autobind
  onLogin() {

  }

  render() {

    const { images, isLoading, totalVotes, totalSimas,
      userTeam, userName, navigator } = this.props;
    let { user } = this.props.route;

    // Show Current user if not user selected
    if (!user) {
      user = { name: userName }
    }

    const imagesCount = images.size;

    return (
      <View style={{ flex: 1 }}>

      <View style={{ backgroundColor:theme.secondary }}>
        <Modal
          onRequestClose={this.onCancel}
          visible={this.state.loginVisible}
          animationType={'slide'}>
          <View style={styles.info}>
            <Text style={styles.infoText}>Login as moderator</Text>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              autoFocus={false}
              multiline={false}
              clearButtonMode={'while-editing'}
              returnKeyType={'send'}
              blurOnSubmit={true}
              style={styles.inputField}
              onChangeText={this.onChangeEmail}
              numberOfLines={1}
              maxLength={99}
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
              maxLength={99}
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
        </Modal>
      </View>

      {false && <Header backgroundColor={theme.secondary} title={user.name} navigator={navigator} />}
      <ParallaxView
        backgroundSource={headerImage}
        windowHeight={270}
        style={{ backgroundColor:theme.white }}
        header={(
          <View style={styles.header}>
            {!isIOS &&
            <View style={styles.backLink}>
              <TouchableHighlight onPress={() => navigator.pop()} style={styles.backLinkText} underlayColor={'rgba(255, 255, 255, .1)'}>
                <Icon name="arrow-back" size={28} style={styles.backLinkIcon}  />
              </TouchableHighlight>
            </View>
            }
            <View style={styles.avatar}>
              <Icon style={styles.avatarText} name="person-outline" />
            </View>
            <Text style={styles.headerTitle} onPress={() => this.showAdminLogin()}>
              {user.name}
            </Text>
            <Text style={styles.headerSubTitle}>
              {userTeam || user.team}
            </Text>
            <View style={styles.headerKpis}>
              <View style={styles.headerKpi}>
                <Text style={styles.headerKpiValue}>{!isLoading ? imagesCount : '-'}</Text>
                <Text style={styles.headerKpiTitle}>photos</Text>
              </View>
              <View style={styles.headerKpi}>
                <Text style={styles.headerKpiValue}>{!isLoading ? totalVotes : '-'}</Text>
                <Text style={styles.headerKpiTitle}>votes for photos</Text>
              </View>
              <View style={styles.headerKpi}>
                <Text style={styles.headerKpiValue}>{!isLoading ? (totalSimas || '-') : '-'}</Text>
                <Text style={styles.headerKpiTitle}>simas</Text>
              </View>
            </View>
          </View>
        )}
      >

      <View style={styles.container}>
        {isLoading && <View style={styles.loader}><Loader size="large" /></View>}
        {images.size > 0 &&
          <View style={styles.imageContainer}>
            {images.map(image =>
              <View key={image.get('id')}>
                <TouchableOpacity
                activeOpacity={1}
                onPress={() => this.props.openLightBox(image.get('id'))}
                >
                  <Image
                    key={image.get('id')}
                    style={{height: width / 3 - 5, width: width / 3 - 5, margin: 2, backgroundColor: theme.stable}}
                    source={{uri: image.get('url')}}/>
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
        {!isLoading && !images.size &&
          <View style={styles.imageTitleWrap}>
            <Text style={styles.imageTitle}>No photos</Text>
          </View>
        }
      </View>
      </ParallaxView>
      </View>
    );
  }
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.white,
    minHeight: height / 2
  },
  header: {
    flex:1,
    elevation: 3,
    paddingTop: 30,
    alignItems: 'center',
    justifyContent: 'center'
  },
  backLink: {
    position: 'absolute',
    left: 7,
    top: 7,
    zIndex: 2,
  },
  backLinkText: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.transparent
  },
  backLinkIcon: {
    color: theme.white
  },
  headerTitle:{
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: theme.light,
    marginBottom: 3,
  },
  headerSubTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'rgba(0,0,0,.6)',
    opacity: 0.9,
  },
  avatar: {
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    height: 90,
    backgroundColor: theme.stable,
    borderRadius: 45,
  },
  avatarText: {
    backgroundColor: theme.transparent,
    color: theme.secondary,
    fontSize: 60,
  },
  headerKpis: {
    alignItems: 'center',
    flexDirection: 'row'
  },
  headerKpi: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 25,
  },
  headerKpiTitle: {
    color: theme.accentLight,
    fontWeight: '500',
    fontSize: 11,
  },
  headerKpiValue: {
    fontSize: 26,
    color: theme.accentLight,
    fontWeight: '400'
  },
  loader: {
    marginTop: 50
  },
  imageContainer:{
    margin: 1,
    marginTop: 2,
    marginBottom: 30,
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: 50,
    alignItems: 'flex-start',
    justifyContent: 'flex-start'
  },
  imageTitle: {
    textAlign: 'center',
    color: theme.grey,
    margin: 20,
    marginTop: 40,
    fontSize: 15,
    fontWeight: '600'
  },
  imageTitleWrap: {
    flex: 1,
    marginTop: 0
  },
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
});


const mapDispatchToProps = { openLightBox, fetchUserImages };

const mapStateToProps = state => ({
  images: getUserImages(state),
  isLoading: isLoadingUserImages(state),
  totalSimas: getTotalSimas(state),
  totalVotes: getTotalVotesForUser(state),
  userId: getUserId(state),
  userName: getUserName(state),
  userTeam: getUserTeam(state)
});

export default connect(mapStateToProps, mapDispatchToProps)(UserView);
