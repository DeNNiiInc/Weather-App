<?php
// Centralized Secrets Configuration
// Copy this file to secrets.php and fill in your actual credentials

global $secrets;
$secrets = [];

// SSH SERVER
$secrets['ssh_username'] = 'YOUR_SSH_USERNAME';
$secrets['ssh_password'] = 'YOUR_SSH_PASSWORD';
$secrets['ssh_host'] = 'YOUR_SERVER_IP';

// Github Details
$secrets['github_username'] = 'YOUR_GITHUB_EMAIL';
$secrets['github_token'] = 'YOUR_GITHUB_PERSONAL_ACCESS_TOKEN';

// MYSQL Database Credentials
$secrets['db_host'] = 'localhost';
$secrets['db_name'] = 'YOUR_DATABASE_NAME';
$secrets['db_user'] = 'YOUR_DATABASE_USER';
$secrets['db_pass'] = 'YOUR_DATABASE_PASSWORD';
$secrets['db_root_pass'] = 'YOUR_MYSQL_ROOT_PASSWORD';
