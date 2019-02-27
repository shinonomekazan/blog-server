# blog-server

## このリポジトリについて

[blog](https://cli.vuejs.org/)のFirebase側です。

詳しくはそちらのリポジトリをご参照ください。

## LICENSE

特に意味はありませんがMITです。

詳しくは[LICENSE](./LICENSE)をご参照ください。

## 必要そうな情報

- `firestore.rules` は使ってます
    - `npm run deploy:firestore` でデプロイできます
- `functions` は使ってます
    - functionsにcdした後で`npm run deploy` でデプロイできます
- `hosting` は使ってます
    - `npm run deploy:hosting` でデプロイできます
- `public` の内容
    - [blog](https://cli.vuejs.org/) で `npm run build` するとできる `dist` の内容をコピーしてます
    - `env.local` が入るので変なものが入り込まないように注意して下さい

あとはまだ勉強中なのでテンプレのままです。
