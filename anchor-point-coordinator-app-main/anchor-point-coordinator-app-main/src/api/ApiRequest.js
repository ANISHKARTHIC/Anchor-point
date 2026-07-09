import axios from 'axios';
import config from './config.json';
import Keys from '../constants/Keys';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default ApiRequest = ({url, data, method = 'GET'}) => {
  return new Promise(async (resolve, reject) => {
    let token = await AsyncStorage.getItem(Keys.TOKEN);
    //console.log("endpoinr==>ggg",config.url+url,"\nToken,",token)
    let requestParams = {
      url: config.url + url,
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? 'Bearer ' + token : null,
      },
    };
    if (data) {
      requestParams.data = data;
    }
    axios
      .request(requestParams)
      .then(res => {
         //console.log("Success",res);
        if (res && res?.data) {
          resolve(res?.data);
        } else {
          resolve({});
        }
      })
      .catch(err => {
        console.log("Error",err);
        if (err?.response?.data) {
          let {detail} = err?.response?.data;
          reject(detail);
        } else {
          reject('Unknown Error');
        }
      });
  });
};
