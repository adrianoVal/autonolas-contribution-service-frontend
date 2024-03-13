/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import Web3 from 'web3';
import PropTypes from 'prop-types';
import { useAccount, useBalance, useDisconnect } from 'wagmi';
import styled from 'styled-components';
import {
  CannotConnectAddressOfacError,
  notifyError,
} from '@autonolas/frontend-library';

import { setChainId, setUserBalance } from 'store/setup';
import {
  getChainId,
  getChainIdOrDefaultToMainnet,
  isAddressProhibited,
} from 'common-util/functions';
import SignInToOrbis from 'components/SignInToOrbis';

const LoginContainer = styled.div`
  display: flex;
  align-items: center;
  font-size: 18px;
  line-height: normal;
`;

export const LoginV2 = ({
  onConnect: onConnectCb,
  onDisconnect: onDisconnectCb,
}) => {
  const dispatch = useDispatch();
  const { disconnect } = useDisconnect();

  const { address, connector, chainId } = useAccount({
    onConnect: ({ address: currentAddress }) => {
      if (isAddressProhibited(currentAddress)) {
        disconnect();
      } else if (onConnectCb) {
        onConnectCb({
          address: address || currentAddress,
          balance: null,
          chainId,
        });
      }
    },
    onDisconnect() {
      if (onDisconnectCb) {
        onDisconnectCb();
      }
    },
  });

  // Update the balance
  const { data: balance } = useBalance({ address });
  useEffect(() => {
    if (balance?.formatted) {
      dispatch(setUserBalance(balance.formatted));
    }
  }, [balance?.formatted]);

  useEffect(() => {
    // if chainId is undefined, the wallet is not connected & default to mainnet
    if (chainId === undefined) {
      /**
       * wait for 0ms to get the chainId & set it to redux to avoid race condition
       * and dependent components are loaded once the chainId is set
       */
      setTimeout(() => {
        const tempChainId = getChainId();
        dispatch(setChainId(tempChainId));
      }, 0);
    } else {
      const tempChainId = getChainIdOrDefaultToMainnet(chainId);
      dispatch(setChainId(tempChainId));
    }
  }, [chainId]);

  useEffect(() => {
    const getData = async () => {
      try {
        // This is the initial `provider` that is returned when
        // using web3Modal to connect. Can be MetaMask or WalletConnect.
        const modalProvider = connector?.options?.getProvider?.()
          || (await connector?.getProvider?.());

        if (modalProvider) {
          // We plug the initial `provider` and get back
          // a Web3Provider. This will add on methods and
          // event listeners such as `.on()` will be different.
          const wProvider = new Web3(modalProvider);

          // *******************************************************
          // ************ setting to the window object! ************
          // *******************************************************
          window.MODAL_PROVIDER = modalProvider;
          window.WEB3_PROVIDER = wProvider;

          if (modalProvider?.on) {
            // https://docs.ethers.io/v5/concepts/best-practices/#best-practices--network-changes
            const handleChainChanged = () => {
              window.location.reload();
            };

            modalProvider.on('chainChanged', handleChainChanged);

            // cleanup
            return () => {
              if (modalProvider.removeListener) {
                modalProvider.removeListener(
                  'chainChanged',
                  handleChainChanged,
                );
              }
            };
          }
        }

        return () => null;
      } catch (error) {
        console.error(error);
        return () => null;
      }
    };

    if (connector && !isAddressProhibited(address)) {
      getData();
    }
  }, [connector]);

  // Disconnect if the address is prohibited
  useEffect(() => {
    if (address && isAddressProhibited(address)) {
      disconnect();
      notifyError(<CannotConnectAddressOfacError />);
      if (onDisconnectCb) onDisconnectCb();
    }
  }, [address]);

  return (
    <LoginContainer>
      <div className="mr-8">
        <SignInToOrbis />
      </div>
      <w3m-button balance="hide" />
    </LoginContainer>
  );
};

LoginV2.propTypes = {
  onConnect: PropTypes.func,
  onDisconnect: PropTypes.func,
};

LoginV2.defaultProps = {
  onConnect: undefined,
  onDisconnect: undefined,
};
