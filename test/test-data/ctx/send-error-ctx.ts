export const messageCtx = {
    state: {}, // wait for data
    updateType: 'message',
    updateSubTypes: ['text'],
    message: {
        message_id: 14891,
        from: {
            id: 233233233,
            is_bot: false,
            first_name: 'Test_First_Name',
            last_name: 'Test_Last_Name',
            username: 'test',
            language_code: 'zh-hans'
        },
        chat: {
            id: 233233233,
            first_name: 'Test_First_Name',
            last_name: 'Test_Last_Name',
            username: 'test',
            type: 'private'
        },
        date: 1571720803,
        text: '/sub',
        entities: [
            {
                offset: 0,
                length: 4,
                type: 'bot_command'
            }
        ]
    },
    reply: jest.fn().mockReturnValue({
        message_id: 233,
        from: {
            id: 591928513,
            is_bot: true,
            first_name: "fengkx's RSS_bot",
            username: 'fengkx_RSS_bot'
        },
        chat: {
            id: 233233233,
            first_name: 'Test_First_Name',
            last_name: 'Test_Last_Name',
            username: 'test',
            type: 'private'
        },
        date: 1571721954,
        text: 'Processing, please wait for a while'
    })
};
