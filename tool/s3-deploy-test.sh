#!/bin/sh

exec curl -v http://localhost:3000/api/s3-deploy -F db=@baby.db
