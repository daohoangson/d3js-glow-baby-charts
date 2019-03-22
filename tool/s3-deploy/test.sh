#!/bin/sh

exec curl -v http://localhost:3000/ -F db=@baby.db
