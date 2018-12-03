import React from 'react';

import styled from 'styled-components/macro';
import Img from '../Img';
import Loading from './loading.svg';

const StyledLoadingIndicator = styled.div`
  margin: 2em auto;
  width: 100px;
  height: 100px;
  position: fixed;
  left: 50%;
  top: 35%;
  transform: translate(-50%, -50%);
`;

const LoadingIndicator = () => (
  <StyledLoadingIndicator>
    <Img src={Loading} alt="Loading..." />
  </StyledLoadingIndicator>
);

export default LoadingIndicator;
