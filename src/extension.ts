// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "ProBro" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('vsc-extension-for-browsing-progress-db.proBroBonjour', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage("Bonjour, je m'appelle ProBro.");
	});

	context.subscriptions.push(disposable);
	
	context.subscriptions.push(
		vscode.commands.registerCommand('vsc-extension-for-browsing-progress-db.connect', () => {
		  // Create and show panel
		  const panel = vscode.window.createWebviewPanel(
			'connect',
			'Connect',
			vscode.ViewColumn.One,
			{}
		  );
	
		  // And set its HTML content
		  panel.webview.html = getWebviewContent(panel.webview, context);
		})
	  );
}

function getWebviewContent(webview: vscode.Webview, context: any): string {

	let html: string = ``;
  
	const myStyle = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src', 'connectionScreen.css'));
	
	html += `<!DOCTYPE html>
	<html>
	  <head>
		<meta charset="UTF-8">
	    <link href="${myStyle}" rel="stylesheet" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
	  </head>
	<body>
	  <div class="container">
		<div class="title">Connect to server</div>
		<div class="content">
		  <form action="#">
			<div class="connection-details">
			  <div class="input-box">
				<input type="text" placeholder="Connection name">
			  </div>
			</div>
			<div class="connection-details">
			  <div class="input-box-wide">
				<input type="text" placeholder="Description">
			  </div>
			</div>
			<div class="connection-details">
			  <div class="input-box">
				<input type="text" placeholder="Host name">
			  </div>
			  <div class="input-box">
				<input type="text" placeholder="Port">
			  </div>
			  <div class="input-box">
				<input type="text" placeholder="User ID">
			  </div>
			  <div class="input-box">
				<input type="text" placeholder="Password">
			  </div>
			  <div class="input-box">
				<input type="text" placeholder="Aliases">
			  </div>
			  <div class="input-box">
				<input type="text" placeholder="Group">
			  </div>
			  <div class="input-box-wide">
				<input type="text" placeholder="Other parameters">
			  </div>
			</div>
			<div class="button">
			  <input type="submit" value="Connect">
			</div>
		  </form>
		</div>
	  </div>
	
	</body>
	</html>`;

	return html;
}

// this method is called when your extension is deactivated
export function deactivate() {}
