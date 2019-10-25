const chat = {
    id: 233233233,
    first_name: 'Test_First_Name',
    last_name: 'Test_Last_Name',
    username: 'test',
    type: 'private'
};

exports.pass = (text, channelId) => ({
    state: {
        chat
    },
    async getChat() {
        return this.telegram.getChat();
    },
    async getChatAdministrators() {
        return this.telegram.getChatAdministrators();
    },
    telegram: {
        getChat: async (id) => {
            // return current chat or by getChatById
            const chatId = chat.id;
            return id
                ? {
                      id: channelId,
                      type: 'private'
                  }
                : {
                      id: chatId,
                      type: 'private'
                  };
        },
        getMe: () => {
            return {
                id: 233
            };
        },
        getChatAdministrators: () => {
            const chatId = chat.id;
            return [
                {
                    user: {
                        id: chatId
                    }
                },
                {
                    user: {
                        id: 233 // bot id
                    }
                }
            ];
        }
    },
    message: {
        text,
        from: chat
    }
});

exports.noAdmin = (text, channelId) => {
    const pass = exports.pass(text, channelId);
    const chatId = pass.state.chat.id;
    pass.telegram.getChatAdministrators = () => {
        return [
            {
                user: {
                    id: chatId
                }
            }
        ];
    };
    return pass;
};
