#!/bin/bash
# ==========================================================
# Testing backend en AWS
# Author : Franco Barrientos <franco.barrientos@arzov.com>
# ==========================================================


# ----------------------------------------------------------
#  Generar template.yml
# ----------------------------------------------------------

chmod +x samtemplate.sh; ./samtemplate.sh
status=$?


# ----------------------------------------------------------
#  Levantar servicio AWS DynamoDB
# ----------------------------------------------------------

docker network create arzov-local-network
docker run --name aws-arzov -d -p 8000:8000 \
    --network arzov-local-network \
    --network-alias arzov \
    amazon/dynamodb-local \
    -jar DynamoDBLocal.jar \
    -inMemory -sharedDb

# Crear tablas
cd dynamodb/tables

declare -A tables=(
  [arv-users]=5
)

for table in "${!tables[@]}"
do
    ln="${tables[$table]}"
    cd $table
    awk "NR >= ${ln}" resource.yml > tmp.yml
    aws dynamodb create-table --cli-input-yaml file://tmp.yml --endpoint-url http://localhost:8000 --region localhost > null.log
    rm tmp.yml; rm null.log; cd ../
done

cd ../../


# ----------------------------------------------------------
#  Levantar servicio AWS Lambda
# ----------------------------------------------------------

sam local start-lambda --docker-network arzov-local-network -t template.yml \
    --parameter-overrides "
        ParameterKey=AWSDefaultRegion,ParameterValue=$AWS_DEFAULT_REGION
        ParameterKey=FacebookAppId,ParameterValue=$FACEBOOK_APP_ID
        ParameterKey=FacebookAppSecret,ParameterValue=$FACEBOOK_APP_SECRET
        ParameterKey=GoogleAppId,ParameterValue=$GOOGLE_APP_ID
        ParameterKey=GoogleAppSecret,ParameterValue=$GOOGLE_APP_SECRET
        ParameterKey=AWSCognitoAuthDomain,ParameterValue=$AWS_COGNITO_AUTH_DOMAIN
        ParameterKey=AWSR53UMTDomain,ParameterValue=$AWS_R53_UMT_DOMAIN
    " \
    --env-vars lambda/functions/env.json & pids="${pids-} $!"
status=$((status + $?))


# ----------------------------------------------------------
#  Pruebas AWS Lambda
# ----------------------------------------------------------

cd lambda/functions

lambdas="
    arv-auth-pre-signup
    arv-auth-post-confirmation
"

for lambda in $lambdas
do
    cd $lambda; npm install; npm run test
    status=$((status + $?))
    cd ../
done

# Detener servicios
kill -9 $pids
docker kill aws-arzov
docker rm aws-arzov
docker network rm arzov-local-network

# Remover archivos temporales
cd ../../
rm template.yml
status=$((status + $?))

exit $status