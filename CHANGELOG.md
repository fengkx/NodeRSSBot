# [0.11.0](https://github.com/fengkx/NodeRSSBot/compare/v0.10.1...v0.11.0) (2022-02-09)

### Bug Fixes

-   catch error in handle Error ([8f10b0e](https://github.com/fengkx/NodeRSSBot/commit/8f10b0e3d213813c4a244779226d13e7d3dea53d))
-   child process should exit on disconnect ([91b9635](https://github.com/fengkx/NodeRSSBot/commit/91b9635090f7d79f03217c37b7c0c26dfd7f1c4d))
-   docker ([05acb07](https://github.com/fengkx/NodeRSSBot/commit/05acb077d59a1ee5add1b2cfee516b95f369515a))
-   i18n of error message ([4d632fc](https://github.com/fengkx/NodeRSSBot/commit/4d632fc61b6f426e9a26905057cded8a9413d613))
-   kill child process when parent exit ([2ea489a](https://github.com/fengkx/NodeRSSBot/commit/2ea489a4c1932521687765961bf7e34f740b283f))
-   minify-docker ([fecc110](https://github.com/fengkx/NodeRSSBot/commit/fecc110425ce33636bb34bac995446ff062336db))
-   prevent duplicate url ([4092851](https://github.com/fengkx/NodeRSSBot/commit/4092851cef111f6faf8efd524e9c36951c406e4f))
-   remove 'socket' timeout ([b730141](https://github.com/fengkx/NodeRSSBot/commit/b730141b52c1a0c8a92cc728a162a45f3bc9e1fe))
-   remove workaround with got@12 ([ab9342f](https://github.com/fengkx/NodeRSSBot/commit/ab9342ff2c649921a087a0c92de9703cbfa6e953))
-   type compile error ([988fd93](https://github.com/fengkx/NodeRSSBot/commit/988fd93b653c34160c218576f92e3b0ac079170a))
-   workaround of jest@27 ([9ac0464](https://github.com/fengkx/NodeRSSBot/commit/9ac04648d931bdb1df76f87a8fc2f94f40376bfe))

### Features

-   change pool size in pg to 8 ([a14c73b](https://github.com/fengkx/NodeRSSBot/commit/a14c73bdbc87f1e2df4b0415294fbd015b85e292))
-   drop got use make-fetch-happen instead ([#615](https://github.com/fengkx/NodeRSSBot/issues/615)) ([1b7606a](https://github.com/fengkx/NodeRSSBot/commit/1b7606acb58867fd9caff236386f20c640bfb2f8))
-   more timeout setting ([9691120](https://github.com/fengkx/NodeRSSBot/commit/9691120b6a6af15a0cf6437823c20677048dbf67))
-   remove RSSBOT_BEFORE_RESP_TIMEOUT ([6129c37](https://github.com/fengkx/NodeRSSBot/commit/6129c379edc29334ec84a5b1792c1567c29925c0))

### Reverts

-   Revert "build(deps): bump @sentry/tracing from 6.16.1 to 6.17.4 (#648)" (#651) ([584b7ac](https://github.com/fengkx/NodeRSSBot/commit/584b7ac7bf68edbf10ccfee1c7895480fb349507)), closes [#648](https://github.com/fengkx/NodeRSSBot/issues/648) [#651](https://github.com/fengkx/NodeRSSBot/issues/651)

## [0.10.1](https://github.com/fengkx/NodeRSSBot/compare/v0.10.0...v0.10.1) (2021-04-14)

### Bug Fixes

-   add admin right error check ([88e8219](https://github.com/fengkx/NodeRSSBot/commit/88e8219425719ac0608409479dd7a2b3fc73c1ce))
-   feed contains unorder item ([5702bec](https://github.com/fengkx/NodeRSSBot/commit/5702bec6bea2e56351fa805bd5ffbae2e331e616))
-   import tigger in group chat ([150b0bd](https://github.com/fengkx/NodeRSSBot/commit/150b0bd45972bbd661b61004dc8af491d18af502))
-   query string urlencode problem ([e79a7ea](https://github.com/fengkx/NodeRSSBot/commit/e79a7eaa5b918108ee1b6a02582da9c7e8e315e7))
-   remove useless code ([925e678](https://github.com/fengkx/NodeRSSBot/commit/925e678ce77c7dfaf788097a6282084cc3c3476a))

### Features

-   version command ([b1c3b61](https://github.com/fengkx/NodeRSSBot/commit/b1c3b61e6dbd951773fdd90ca61721ca9a51ce1f))

### Performance Improvements

-   optimize sql performance ([8801682](https://github.com/fengkx/NodeRSSBot/commit/8801682c9df18623faf47485294e2095c1b3007b))

# [0.10.0](https://github.com/fengkx/NodeRSSBot/compare/v0.9.0...v0.10.0) (2021-03-10)

### Bug Fixes

-   apply workaround of got's bug [#353](https://github.com/fengkx/NodeRSSBot/issues/353) ([88319dd](https://github.com/fengkx/NodeRSSBot/commit/88319dd6514b5ff856045f4dd3c166c802c95730))
-   datetime compare in SQLite ([4366fa0](https://github.com/fengkx/NodeRSSBot/commit/4366fa0eb2bc09fd83394c6b1949a58eae49d6bc))
-   default http_cache to false ([375addb](https://github.com/fengkx/NodeRSSBot/commit/375addb589e911d8bb224245313d741d981390db))
-   http_cache config ([e24e7bf](https://github.com/fengkx/NodeRSSBot/commit/e24e7bf92ecfc6e72b729e42ab4298b733e4ef81))
-   reduce db pressure ([e38e2f0](https://github.com/fengkx/NodeRSSBot/commit/e38e2f0921b9436bc77e5b1751974ee27671f230))
-   rss pagination in non private chat ([7e602b4](https://github.com/fengkx/NodeRSSBot/commit/7e602b4f9bfa7bca1b7a2b8b1312fa533bd2f167))

### Features

-   even smaller docker image ([deadc4b](https://github.com/fengkx/NodeRSSBot/commit/deadc4bb29199c65f035be14ec798f9850082e1c))
-   HTTP 304 cache ([198dfb2](https://github.com/fengkx/NodeRSSBot/commit/198dfb2e965258e4ee9a4e934ca959259fac61b6))
-   http cache setting ([60760a1](https://github.com/fengkx/NodeRSSBot/commit/60760a1c7670bd23cde0723c5357d577de94502b))
-   smaller docker image with nft ([eeb0f3c](https://github.com/fengkx/NodeRSSBot/commit/eeb0f3ca529e0aaba2db36b57a258614c957fe6e))

# [0.9.0](https://github.com/fengkx/NodeRSSBot/compare/v0.8.4...v0.9.0) (2021-03-07)

### Bug Fixes

-   handleRedirect ([95ce860](https://github.com/fengkx/NodeRSSBot/commit/95ce86077043ddcb702dc49954539a902ddf05cd))
-   sanitize text in two-key-reply ([7cc596f](https://github.com/fengkx/NodeRSSBot/commit/7cc596f15f320ac303b36c2085d1d3161d641427))
-   ttl NaN error ([9485f83](https://github.com/fengkx/NodeRSSBot/commit/9485f833e1c5b80d8699256891595740c1d2af2c))
-   ttl update error ([e6620dc](https://github.com/fengkx/NodeRSSBot/commit/e6620dcf70f29774d8d299bd0fd561aa04101a6a))

### Features

-   add persian language ([#318](https://github.com/fengkx/NodeRSSBot/issues/318)) ([d0fafa1](https://github.com/fengkx/NodeRSSBot/commit/d0fafa1a419d4a4db396ed50700b219c6558c724))
-   treat RSS ttl value seriously ([680e87e](https://github.com/fengkx/NodeRSSBot/commit/680e87ee720a761bf84fd1f56f15eba6cfe3d46d))

## [0.8.4](https://github.com/fengkx/NodeRSSBot/compare/v0.8.3...v0.8.4) (2021-01-22)

### Bug Fixes

-   add users user_id unique index ([b95a9b0](https://github.com/fengkx/NodeRSSBot/commit/b95a9b0f3279f4d645812ed210f34b53057fbdbe))
-   alertTable ([fc242fe](https://github.com/fengkx/NodeRSSBot/commit/fc242fe2d9fe17c4371b769df1638b6ff687b38c))
-   ENTITIES_TOO_LONG error ([e216827](https://github.com/fengkx/NodeRSSBot/commit/e216827313d3bef3ee50b628d1eb058d05ca4328))
-   lower db pressure ([4c7c93b](https://github.com/fengkx/NodeRSSBot/commit/4c7c93bc84014f67424abc48635fca21e7efdd16))
-   lower db pressure and make use of type ([bda982d](https://github.com/fengkx/NodeRSSBot/commit/bda982d32c059d7b98925b6416401d4ec9bec067))
-   temaplte string ([f90f70b](https://github.com/fengkx/NodeRSSBot/commit/f90f70b7ea9f0ea4fb07a0b87a5995b80287c6ec))
-   types ([1eb9355](https://github.com/fengkx/NodeRSSBot/commit/1eb9355a26133e4bbdc774997fc5d6d654e5212c))
-   where using feed_id ([61a3252](https://github.com/fengkx/NodeRSSBot/commit/61a3252cab3bf2f1c8c0e460f067b400dc9095a7))

## [0.8.3](https://github.com/fengkx/NodeRSSBot/compare/v0.8.2...v0.8.3) (2021-01-16)

### Bug Fixes

-   bigger pool in sqlite ([319af7c](https://github.com/fengkx/NodeRSSBot/commit/319af7c668dd0d155047fdb76efe9677747c0f9b))
-   **eslint:** fix new eslint rule ([6112ace](https://github.com/fengkx/NodeRSSBot/commit/6112ace2ad13a207addbbd404ac249b48c39664c))
-   findFeed && user deactiveated ([d3fe70f](https://github.com/fengkx/NodeRSSBot/commit/d3fe70f75f07781850145a9913db796c2bbd0b2c))
-   group import filename ([e864040](https://github.com/fengkx/NodeRSSBot/commit/e8640401dd2babf4e4ab931c107cc6d394904376))
-   urldecode of special character ([c031403](https://github.com/fengkx/NodeRSSBot/commit/c031403ae59bd877b9c168314062473aa8acd1ba))

## [0.8.2](https://github.com/fengkx/NodeRSSBot/compare/v0.8.1...v0.8.2) (2020-11-20)

### Bug Fixes

-   init sendItems ([f815c31](https://github.com/fengkx/NodeRSSBot/commit/f815c316f2128e39a8d4e24a22029a6bbb1e78be))

## [0.8.1](https://github.com/fengkx/NodeRSSBot/compare/v0.8.0...v0.8.1) (2020-11-20)

### Bug Fixes

-   db connection pool ([ff2fcc2](https://github.com/fengkx/NodeRSSBot/commit/ff2fcc2cf730a01e83a20ce423588f06c86cd464))
-   id not init in some cases ([e32c79c](https://github.com/fengkx/NodeRSSBot/commit/e32c79c0b38bfc1c05691a63a3dcaf25b40c38ae))
-   ignore following items when checking new item ([a1d87f1](https://github.com/fengkx/NodeRSSBot/commit/a1d87f1e29ec4fba0635cc5d4767a03f939d5a3a))
-   remove unuse sql ([67bb0a3](https://github.com/fengkx/NodeRSSBot/commit/67bb0a302af0c73564be0cbefc0870f03de448bf))
-   try to fix issue reply link message in group ([d7ab435](https://github.com/fengkx/NodeRSSBot/commit/d7ab4359dd59204b96464479e64d5775632ecde4))
-   typo ([743f444](https://github.com/fengkx/NodeRSSBot/commit/743f44488ac11568ecda52b27bd23c65e88d2162))

### Features

-   camaro and gc in fetch process ([080427f](https://github.com/fengkx/NodeRSSBot/commit/080427fea77e656b021cd5c3e8b9317fdc399055))

# [0.8.0](https://github.com/fengkx/NodeRSSBot/compare/v0.7.1...v0.8.0) (2020-11-05)

## [0.7.1](https://github.com/fengkx/NodeRSSBot/compare/v0.7.0...v0.7.1) (2020-11-04)

### Bug Fixes

-   exported opml should escape to valid xml ([5c4d882](https://github.com/fengkx/NodeRSSBot/commit/5c4d882879b6569bd7734ee09776365686cb7010))

# [0.7.0](https://github.com/fengkx/NodeRSSBot/compare/v0.6.1...v0.7.0) (2020-11-03)

### Bug Fixes

-   update feed title when fetch feed ([4d1ebd1](https://github.com/fengkx/NodeRSSBot/commit/4d1ebd1d212a132b16f9f843dbe5a8bfa89a251b))

### Features

-   allow list by user id [#250](https://github.com/fengkx/NodeRSSBot/issues/250) ([3617454](https://github.com/fengkx/NodeRSSBot/commit/3617454a3f21f77f254b397779507a1450a18c1c))

## [0.6.1](https://github.com/fengkx/NodeRSSBot/compare/0.6.0...v0.6.1) (2020-05-01)

### Bug Fixes

-   disable http2 because of bug ([a5b765f](https://github.com/fengkx/NodeRSSBot/commit/a5b765f79b62140e136cee129afb4c358dd0254b))
-   msg conatin " can't send [#186](https://github.com/fengkx/NodeRSSBot/issues/186) ([6e700b4](https://github.com/fengkx/NodeRSSBot/commit/6e700b49002aa53bc76251072c4cbe18647ab0a6))

# [0.6.0](https://github.com/fengkx/NodeRSSBot/compare/v0.5.1...0.6.0) (2020-04-20)

### Bug Fixes

-   only change url on 301 ([b8b9b38](https://github.com/fengkx/NodeRSSBot/commit/b8b9b38987f21a24ede559eb9e32fff88af4c4e9))

### Features

-   add remove_keyboard on processing msg ([78ed80d](https://github.com/fengkx/NodeRSSBot/commit/78ed80de85f02fdffd58d48f5f07b5691bc4137e))
-   heath command ([ee5d385](https://github.com/fengkx/NodeRSSBot/commit/ee5d38581e9107c4165098238b344cdd0f04b9d3))

## [0.5.1](https://github.com/fengkx/NodeRSSBot/compare/v0.5.0...v0.5.1) (2020-03-25)

### Bug Fixes

-   migrate user when new id not exist ([a9e86e0](https://github.com/fengkx/NodeRSSBot/commit/a9e86e0e4329a04876e6d8d1166ab6eb3a2a9975))

# [0.5.0](https://github.com/fengkx/NodeRSSBot/compare/v0.4.1...v0.5.0) (2020-03-24)

### Bug Fixes

-   catch err is type any ([e1aeec6](https://github.com/fengkx/NodeRSSBot/commit/e1aeec678068834fc9560fc3a3f00f73ca1dd712))
-   get Option value ([5910e2c](https://github.com/fengkx/NodeRSSBot/commit/5910e2cbed8b3dc1ec98a04999db9d5ef7390ea8))
-   parseInt cb.id ([848407e](https://github.com/fengkx/NodeRSSBot/commit/848407efb498838ce50f0cf11ee40894aab77189))
-   pass the CI ([9f2763f](https://github.com/fengkx/NodeRSSBot/commit/9f2763f3fed415a4218b9de877988fa52b7fd6cd))
-   path in docker ([c13c6ae](https://github.com/fengkx/NodeRSSBot/commit/c13c6aeb3b3693c7c59175530685ad68fadc31cb))
-   process send err as Messager ([a67c89b](https://github.com/fengkx/NodeRSSBot/commit/a67c89b2546397376e09a4203e8fe7862faa8f3e))
-   url contain - treat as channel id ([7cabb1e](https://github.com/fengkx/NodeRSSBot/commit/7cabb1ee45f954604652ffb6fc741eabe79bf0ae))
-   use cross-env ([f177bf6](https://github.com/fengkx/NodeRSSBot/commit/f177bf61ee795354b6917eae4943e79156129f82))

## [0.4.1](https://github.com/fengkx/NodeRSSBot/compare/0.4.0...v0.4.1) (2020-03-13)

### Bug Fixes

-   ctx.state.lang not set ([8a725f1](https://github.com/fengkx/NodeRSSBot/commit/8a725f1a04ce387fde1c2b33e674b0e3e175d639))
-   fix update url sql error ([cf326d0](https://github.com/fengkx/NodeRSSBot/commit/cf326d06ac57b7a3cad449c433817a6e099cc09c))
-   log the string of error ([6e9fb21](https://github.com/fengkx/NodeRSSBot/commit/6e9fb2195c446b7b5f8a3198a2b3f2f08ea67d4d))
-   unsub keyboard only show in private chat ([499eef1](https://github.com/fengkx/NodeRSSBot/commit/499eef10868e6b939ed9d8c9ee3f2d7d0c6a53d1))

# [0.4.0](https://github.com/fengkx/NodeRSSBot/compare/0.3.1...0.4.0) (2019-12-16)

### Bug Fixes

-   fix the logging ([27fe041](https://github.com/fengkx/NodeRSSBot/commit/27fe0416b82cf05cbcd35b84a61431a00c07623c))
-   i18n in help command ([809eb6e](https://github.com/fengkx/NodeRSSBot/commit/809eb6ed4f3bb50e012524c8adb9577200a24a8d))
-   log rotate by day ([a637b1d](https://github.com/fengkx/NodeRSSBot/commit/a637b1d18172655107a9e828f528ccc118602f23))
-   number env add parseInt ([85f292d](https://github.com/fengkx/NodeRSSBot/commit/85f292d518fc8db43a26806b10b874f03586b01b))
-   rotete by day also in error log ([dafa04f](https://github.com/fengkx/NodeRSSBot/commit/dafa04f3dec0c5466d571b2bafd2dd1e6fc079fa))
-   timeout only count resp ([57dd897](https://github.com/fengkx/NodeRSSBot/commit/57dd897175bc9f6a03ccb1d50c7fd226d40cf02e))
-   update lock file as well ([a07ced8](https://github.com/fengkx/NodeRSSBot/commit/a07ced83cc80330b66e48e7e753c34b725f6f82c))

### Features

-   add request timeout configuration ([38d146a](https://github.com/fengkx/NodeRSSBot/commit/38d146aa610fd4e8ee01e64814e06465c99f106b))
-   use better-sqlite-pool ([0b96180](https://github.com/fengkx/NodeRSSBot/commit/0b96180ef356d6aca8949ff218d10497f55e4ca4))
-   use winston-daily-rotate-file gz enable ([09d23f2](https://github.com/fengkx/NodeRSSBot/commit/09d23f20ca863bffb79283ba20fd31828ce60615))

### Reverts

-   Revert "refactor: update to got@10.0.3" ([e28f1fc](https://github.com/fengkx/NodeRSSBot/commit/e28f1fcceadd83277a0455fa45b8c54e043edf28))

## [0.3.1](https://github.com/fengkx/NodeRSSBot/compare/0.3.0...0.3.1) (2019-10-28)

### Bug Fixes

-   can import to channel with id named opml ([c7c050c](https://github.com/fengkx/NodeRSSBot/commit/c7c050c63aa9e1fea92482290356f656bb50a701))
-   can sub with channel id and username ([6c57cc1](https://github.com/fengkx/NodeRSSBot/commit/6c57cc1a3fa3228e0520c3a3295c04c004f91679))
-   fix parese error of it.yaml ([07e23c2](https://github.com/fengkx/NodeRSSBot/commit/07e23c2563743cdd54f2533eb09871cfc520ba76))
-   import reply with i18n ([849dbdc](https://github.com/fengkx/NodeRSSBot/commit/849dbdc6cbb72c221bf8548e8a98f3bba1fd3602))
-   lang keyboards layout 5 item every row ([f98596e](https://github.com/fengkx/NodeRSSBot/commit/f98596e8c2367095be3c1fae21eff2e8ab493c45))

### Performance Improvements

-   enable sqlite instance cache ([0685939](https://github.com/fengkx/NodeRSSBot/commit/0685939762e40dc8ac7efd2304a581a25dd5509d))

# [0.3.0](https://github.com/fengkx/NodeRSSBot/compare/0.2.2...0.3.0) (2019-10-04)

### Bug Fixes

-   fix unescape html tag in telegram message ([731a9d4](https://github.com/fengkx/NodeRSSBot/commit/731a9d4fc5a57d07f9904d8f0174c908299f9a62))
-   new lock file to get rid of sercuity alert ([5ee7d60](https://github.com/fengkx/NodeRSSBot/commit/5ee7d6054fd61582cf1577f8e049e52c353de713))
-   no need to santize string type toSend ([a56998c](https://github.com/fengkx/NodeRSSBot/commit/a56998c71c828ae88ebaaa561fd9baef2b0d5632))
-   sanitize text to send in telegram ([9574417](https://github.com/fengkx/NodeRSSBot/commit/9574417dd77e0b5707d628e31619a4346db52846))
-   setting ctx.state.lang everywhere ([49717d9](https://github.com/fengkx/NodeRSSBot/commit/49717d92f1a20a1cd3745b5d982dc73efb417205))

### Features

-   optional delete subscribes on send err ([b26f7d9](https://github.com/fengkx/NodeRSSBot/commit/b26f7d921bbdc7b382dd59d34c2a189203e23121))

### Performance Improvements

-   reduce sql operator ([a6048f5](https://github.com/fengkx/NodeRSSBot/commit/a6048f5a5e476be7023c243d61e16ce850b5f4ad))

## [0.2.2](https://github.com/fengkx/NodeRSSBot/compare/0.2.1...0.2.2) (2019-07-11)

### Bug Fixes

-   correct language controller ([5087460](https://github.com/fengkx/NodeRSSBot/commit/50874606e2d71ec6474d3e2c3cce1eb1671e8274))

## [0.2.1](https://github.com/fengkx/NodeRSSBot/compare/0.2.0...0.2.1) (2019-07-10)

### Bug Fixes

-   add Accept http header ([891dbfa](https://github.com/fengkx/NodeRSSBot/commit/891dbfa074632318bd9a25f2a9d417d50850821d))
-   add remove keyboard parmater in markup ([082e9cd](https://github.com/fengkx/NodeRSSBot/commit/082e9cdf7198b6fbc50a9c564cebdbf3a1c17ba6))
-   fix error handling in import opml ([385d1de](https://github.com/fengkx/NodeRSSBot/commit/385d1deb1799f244599b756f667831ba9a11cfbe))
-   force reply set true ([0908643](https://github.com/fengkx/NodeRSSBot/commit/090864379f8b926a97b60ca91cdd8e3f1a39a035))

# [0.2.0](https://github.com/fengkx/NodeRSSBot/compare/0.1.1...0.2.0) (2019-07-09)

### Bug Fixes

-   each feed a row ([9c04118](https://github.com/fengkx/NodeRSSBot/commit/9c0411875256a577b60e728dc0e976b218b022fc))
-   set production env when npm start ([1cf9a97](https://github.com/fengkx/NodeRSSBot/commit/1cf9a970ed44b4739d2860802bb74408febe89a9))

### Features

-   unsub by keyboard ([fd5257d](https://github.com/fengkx/NodeRSSBot/commit/fd5257d603175a7b40b7b0ac0663a567b9057155))

## [0.1.1](https://github.com/fengkx/NodeRSSBot/compare/0.1.0...0.1.1) (2019-06-15)

### Bug Fixes

-   **error-handling:** :bug:first feedUrl from array and fix lang when set handeing ([ed45a20](https://github.com/fengkx/NodeRSSBot/commit/ed45a20e7a928037c939d96227abeefa878678c2))

# [0.1.0](https://github.com/fengkx/NodeRSSBot/compare/0.0.11...0.1.0) (2019-06-15)

### Bug Fixes

-   **feed_url:** :sparkles:merge redirected url ([26c3b70](https://github.com/fengkx/NodeRSSBot/commit/26c3b70af90c85c3ecf5c46d6a01552a0cc77897))
-   **log:** remove useless log ([9efa402](https://github.com/fengkx/NodeRSSBot/commit/9efa40240326fab15dbd1cea36d21d96bbc14c67))
-   **sub-multi-url sending:** only send when some feed sub successfully ([0d20591](https://github.com/fengkx/NodeRSSBot/commit/0d20591210c07ae05f5e2b74ef52d298fe520881))
-   url match cause handleing message multi-time ([6d07a59](https://github.com/fengkx/NodeRSSBot/commit/6d07a59e13c29e92ba8ffb312195040cddbdf018))

### Features

-   clean subscribes when chat not found ([a87b5e6](https://github.com/fengkx/NodeRSSBot/commit/a87b5e610b1841e9e355cfa68bf0fe8114677fcf))
-   **config:** configuration of request cocurrency ([21ac509](https://github.com/fengkx/NodeRSSBot/commit/21ac509403fb9db72ec240b9eb02faa21d5fb94b))
-   **error-send-ev:** auto update feed url ([a7adba0](https://github.com/fengkx/NodeRSSBot/commit/a7adba0a8493631674fc434fd1c4c6b450cc82df))
-   **request:** handle encoding using iconv-lite ([75fb8fb](https://github.com/fengkx/NodeRSSBot/commit/75fb8fb5aedb37d75c14814cfc74dbad1633bd35))
-   support language switch ([c8ef466](https://github.com/fengkx/NodeRSSBot/commit/c8ef466c9e60608f871057567742708892a89f12))
-   **test-url:** auto detect feed url ([9adf291](https://github.com/fengkx/NodeRSSBot/commit/9adf291585774089ed15675b0674a132288434cd))

## [0.0.10](https://github.com/fengkx/NodeRSSBot/compare/0.0.9...0.0.10) (2019-04-05)

### Bug Fixes

-   channel using ([3ebc8fe](https://github.com/fengkx/NodeRSSBot/commit/3ebc8fe009d4823cb3cf0655df93f5d267e07e11))

### Features

-   channel import support ([013e2af](https://github.com/fengkx/NodeRSSBot/commit/013e2af1ba91d16d44aeef6f1df1a1d75e6f89fc))
-   import support channel then reply ([3addbeb](https://github.com/fengkx/NodeRSSBot/commit/3addbeb1cf3f807aeebecc994c044c1ecc8b9ed0))
-   RSS VIEWALL Pagination ([40b4f19](https://github.com/fengkx/NodeRSSBot/commit/40b4f191bf816a57668550222a65c5557feee004))

## [0.0.9](https://github.com/fengkx/NodeRSSBot/compare/0.0.8...0.0.9) (2019-03-10)

### Bug Fixes

-   no updateHashList while network error ([ca4cfe8](https://github.com/fengkx/NodeRSSBot/commit/ca4cfe817830d358090f7356ddc91c9717556501))

## [0.0.8](https://github.com/fengkx/NodeRSSBot/compare/0.0.7...0.0.8) (2019-01-05)

### Bug Fixes

-   message undefined when button callback ([a4db321](https://github.com/fengkx/NodeRSSBot/commit/a4db321740f47e37a2f0353fdba026d4f3100d17))

## [0.0.7](https://github.com/fengkx/NodeRSSBot/compare/0.0.6...0.0.7) (2018-12-26)

## [0.0.6](https://github.com/fengkx/NodeRSSBot/compare/0.0.5...0.0.6) (2018-12-24)

## [0.0.5](https://github.com/fengkx/NodeRSSBot/compare/0.0.4...0.0.5) (2018-12-24)

## [0.0.4](https://github.com/fengkx/NodeRSSBot/compare/0.0.3...0.0.4) (2018-12-23)

## [0.0.3](https://github.com/fengkx/NodeRSSBot/compare/0.0.2...0.0.3) (2018-12-23)

## [0.0.2](https://github.com/fengkx/NodeRSSBot/compare/0.0.1...0.0.2) (2018-12-23)
