pipeline {
    agent {
        kubernetes {}
    }
    stages {
        stage('Build') {
            when {
                branch 'master-7.6.3'
            }
            steps {
                build job: 'buildFrontend', parameters: [string(name: 'branch', value: env.GIT_BRANCH)]
            }
        }
    }
}
