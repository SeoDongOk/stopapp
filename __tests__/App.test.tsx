/**
 * @format
 */

import 'react-native';
import React from 'react';
// Make sure the path is correct and the file exists; if your App.tsx is in 'src' or the root, update the import accordingly.
import App from '../App';
// or, if it's in 'src':
// import App from '../src/App';

// Note: import explicitly to use the types shipped with jest.
import {it} from '@jest/globals';

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

it('renders correctly', () => {
  renderer.create(<App />);
});
