import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  Form,
  Skeleton,
} from 'antd';
import {
  notifyError,
} from '@autonolas/frontend-library';
import { useRouter } from 'next/router';

import orbis, { createPost } from 'common-util/orbis';
// import { checkVeolasThreshold } from 'components/MembersList/requests';
// import { ONE_IN_WEI } from 'util/constants';
import useOrbis from 'common-util/hooks/useOrbis';
import {
  GroupChatContainer,
} from './styles';
import { MessageGroups } from './MessageGroups';
import { MessageInput } from './MessageInput';
import { EmptyStateMessage } from './EmptyStateMessage';

export const GroupChat = () => {
  const [orbisMessages, setOrbisMessages] = useState([]);
  const [orbisMessagesError, setOrbisMessagesError] = useState('');
  // const [showVeOLASModal, setShowVeOLASModal] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const messageWindowRef = useRef(null);
  const account = useSelector((state) => state?.setup?.account);
  const [isSending, setIsSending] = useState(false);
  const [form] = Form.useForm();
  const router = useRouter();
  const { id } = router.query;
  const { isOrbisConnected } = useOrbis();

  const groupMessages = (messages) => Object.entries(
    messages.reduce((acc, msg, index, array) => {
      // Group messages by creator address
      const address = msg?.creator_details?.metadata?.address || 'unknown';
      const { timestamp } = msg;
      const date = new Date(timestamp * 1000);
      const dateKey = date.toISOString().split('T')[0]; // Get date in YYYY-MM-DD format
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      // Check if the current message is from a different sender than the previous message
      const prevMsg = array[index - 1];
      const prevAddress = prevMsg?.creator_details?.metadata?.address || 'unknown';
      if (address !== prevAddress || index === 0) {
        acc[dateKey].push({
          address,
          messages: [msg],
        });
      } else {
        acc[dateKey][acc[dateKey].length - 1]?.messages.push(msg);
      }
      return acc;
    }, {}),
  );

  const loadMessages = async (initialLoad = false) => {
    if (!id) return;

    if (initialLoad) setLoadingInitial(true);

    const { data, error } = await orbis.getPosts(
      {
        context: id,
      },
      undefined,
      undefined,
      true,
    );

    const groupedMessages = groupMessages(data);

    setOrbisMessages(groupedMessages);
    if (error) {
      console.error('Error loading messages:', error);
      setOrbisMessagesError(error.message);
    }

    if (initialLoad) setLoadingInitial(false);
  };

  // Initial load of messages and poll for new messages every 5 seconds
  useEffect(() => {
    loadMessages(true);

    const interval = setInterval(() => {
      loadMessages();
    }, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (messageWindowRef.current) {
      messageWindowRef.current.scrollTop = messageWindowRef.current.scrollHeight;
    }
  }, [loadingInitial, isSending]);

  const handleSubmit = async (formData) => {
    // Temporarily disable requirement to hold veOLAS
    // const meetsVeolasThreshold = await checkVeolasThreshold(
    //   account,
    //   ONE_IN_WEI,
    // );
    // if (process.env.NODE_VERCEL_ENV === 'production' && !meetsVeolasThreshold) {
    //   setShowVeOLASModal(true);
    //   return null;
    // }

    const { messageContent } = formData;

    setIsSending(true);
    const { result, error } = await createPost(
      {
        body: messageContent,
        context: id,
      },
      orbis,
    );

    if (error) {
      notifyError('Error sending message: ', error);
      console.error('Error sending message: ', error);
      setIsSending(false);
      return null;
    }

    await loadMessages();

    form.resetFields(['messageContent']);

    setIsSending(false);
    return result;
  };

  const hasMessages = orbisMessages?.length > 0;

  return (
    <GroupChatContainer bordered={false}>
      {id ? (
        <>
          {loadingInitial && <Skeleton active />}

          {orbisMessagesError
            && `Error loading messages: ${orbisMessagesError}`}

          {hasMessages && !loadingInitial && (
            <div ref={messageWindowRef} className="group-chat-container">
              <MessageGroups messages={orbisMessages} account={account} />
            </div>
          )}

          <MessageInput
            form={form}
            handleSubmit={handleSubmit}
            isSending={isSending}
            account={account}
            isOrbisConnected={isOrbisConnected}
            loadingInitial={loadingInitial}
          />
        </>
      ) : (
        <EmptyStateMessage />
      )}
      {/* Modal not currently in use */}
      {/* <VeolasModal
        showVeOLASModal={showVeOLASModal}
        setShowVeOLASModal={setShowVeOLASModal}
      /> */}
    </GroupChatContainer>
  );
};
