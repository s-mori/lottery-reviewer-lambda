# プルリクレビュアー抽選Lambdaスクリプト

GitHubのプルリクが作成されると、レビュアーを抽選して、Slackのチャンネルに通知するAWS Lambdaスクリプトです。

## 設定

`./config/config.json.sample` をコピーして `config.json` として保存します。

```
{
  "slack_hook_url": "https://hooks.slack.com/services/...",
  "github": {
    "team_id": "12341234",
    "access_token": "AAAAAAAA..."
  }
}
```
### Slackの設定

SlackのIncoming WebHooksを新規作成し、WebhookURLを`slack_hook_url`に設定します。

### GitHubの設定

#### アクセストークンの取得

Settings->Personal access tokensに行って、アクセストークンを発行します。必要なパーミッションは以下のとおりです。

- repo
- admin/read:org

発行したアクセストークンを`github.access_token`に設定します。

#### レビュアーチームの作成

レビュアーに指定したいメンバーをTeamとして作成し、TeamIDを`github.team_id`に設定します。TeamIDは、以下のAPIから取得できます。

```
curl 'https://api.github.com/orgs/:org/teams?access_token=[ACCESS_TOKEN]'
```

## AWS Lambda

### デプロイ

```
$ git clone https://github.com/zaru/lottery-reviewer-lambda.git
$ cd lottery-reviewer-lambda
$ cp ./config/config.json.sample ./config/config.json
$ zip -r lambda.zip index.js config
```

生成したzipファイルをコンソールからアップロードするか、`aws`コマンドを使用してアップロードします。

## AWS API Gateway

GitHubのWebhookからAWS Lambdaを叩くために、API Gatewayを利用します。

- POSTメソッドを作成
- 「統合リクエスト」
- 「本文マッピングテンプレート」
- 「マッピングテンプレートの追加」
  - Key: `application/json`
  - Val: `{ "body": $input.json("$") }`

最後に発行されたEndpointを、対象リポジトリのWebhookに設定します。

### GitHub Webhook

- リポジトリの設定画面から、Webhook&services->Add Webhookで新規作成
- Payload URLにAWS API GatewayのEndpointを入力
- Content-typeを`application/json`選択
- Eventは`Pull request`にチェック

以上で設定は完了です。
