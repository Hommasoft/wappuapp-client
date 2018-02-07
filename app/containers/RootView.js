'use strict';

import React, { Component } from 'react';
import { Platform, StatusBar, AsyncStorage } from 'react-native';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import createLoggerMiddleware from 'redux-logger';
import loggerConfig from '../utils/loggerConfig';
import * as reducers from '../reducers';
import MainView from './MainView';
import * as CompetitionActions from '../actions/competition';
import * as LocationActions from '../actions/location';
import * as RegistrationActions from '../actions/registration';
import { initializeUsersCity, fetchCities } from '../concepts/city';
import { initializeUsersRadio, fetchRadioStations } from '../concepts/radio';
import permissions from '../services/android-permissions';

import { APP_STORAGE_KEY } from '../../env';
import { LOGIN_SUCCESS } from '../actions/registration';
const modKey = `${APP_STORAGE_KEY}:mod`;

const IOS = Platform.OS === 'ios';

const middlewares = [thunk];
if (__DEV__) {
  // Disabling logging might help performance as XCode prints the whole objects
  // without respecing the collapsed parameter
  const logger = createLoggerMiddleware(loggerConfig)
  middlewares.push(logger);
}

const createStoreWithMiddleware = applyMiddleware.apply(this, middlewares)(createStore);
const reducer = combineReducers(reducers);
const store = createStoreWithMiddleware(reducer);

// Fetch actions, check user existance
store.dispatch(CompetitionActions.fetchActionTypes());
store.dispatch(RegistrationActions.getUser());

// Fetch all cities
store.dispatch(fetchCities())
// load selectd city from local storage
.then(() => store.dispatch(initializeUsersCity()))

// load radio settings from local storage
store.dispatch(initializeUsersRadio())
// fetch radio stations
.then(() => store.dispatch(fetchRadioStations()))


class RootView extends Component {
  constructor(props) {
    super(props);

    this.startLocationWatcher = this.startLocationWatcher.bind(this);
  }

  componentDidMount() {

    // Location watcher
    if (IOS) {
      this.startLocationWatcher();
    } else {
      permissions.requestLocationPermission(this.startLocationWatcher);
    }

    // Statusbar style
    if (IOS) {
      StatusBar.setHidden(false)
      StatusBar.setBarStyle('light-content')
    }

    // Check moderator status from local storage
    this.checkModStatus();

  }

  componentWillUnmount() {
    navigator.geolocation.clearWatch(this.watchID);
  }

  startLocationWatcher() {
    const locationOpts = {
      enableHighAccuracy: false,
      timeout: 20000,
      maximumAge: 1000 * 60 * 5
    };

    navigator.geolocation.getCurrentPosition(
      position => this.updateLocation,
      error => console.log(error.message),
      locationOpts
    );
    this.watchID = navigator.geolocation.watchPosition(
      this.updateLocation,
      error => console.log(error.message),
      locationOpts
    );
  }

  updateLocation(position) {
    store.dispatch(LocationActions.updateLocation({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    }));
  }

  checkModStatus() {
    AsyncStorage.getItem(modKey)
    .then(data => {
      const modInfo = data ? JSON.parse(data) : null;
      if ( modInfo == null ) {
        return;
      }
      if (modInfo.admin) {
        store.dispatch({
          type: LOGIN_SUCCESS,
          payload: modInfo
        });
      }
    });
  }

  render() {
    return (
      <Provider store={store}>
        <MainView />
      </Provider>
    );
  }
}

export default RootView;
