#!/usr/bin/env bash
set -e
network=$2
if [ -z "$network" ]; then
  network="testchain"
fi

# SUBGRAPH_PROJECT_DIR is this project path
SUBGRAPH_PROJECT_DIR=${SUBGRAPH_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]%/*}")/.." && pwd)}
# DSS_DEPLOY_PROJECT_DIR is dss-deploy-scripts project path
DSS_DEPLOY_PROJECT_DIR=${DSS_DEPLOY_PROJECT_DIR:-"$SUBGRAPH_PROJECT_DIR/../dss-deploy-scripts"}


ETHSCAN_API_KEY=QAZMCSYUJWC8GDCFVVFM47U74DZ6
MAINNET_API=https://api.etherscan.io/api
GOERLI_API=https://api-goerli.etherscan.io/api

help="Command:

    init_network_data <chainName>      init networkData.json file
    init_abi <chainName>               init abis file
    init_abi_local <chainName>         init abis file in local

    For Example:
    init_network_data mainnet/goerli/testchain
    init_abi mainnet/goerli
    init_abi_local testchain

"

if [ "$network" == "goerli" ]; then
  ETHERSCAN_API_PER=$GOERLI_API
else
  ETHERSCAN_API_PER=$MAINNET_API
fi

#get contract name from dss-deploy-scripts/contracts.json by contract class(CONTRACT_NAMES)
function get_contracts_name() {
  contract_class=$1
  contract_name=$(jq -r '.[] as $c|$c.contracts[]|select(.class=="'"$contract_class"'")|.name' "$DSS_DEPLOY_PROJECT_DIR/contracts.json")
  if [ -z "$contract_name" ]; then
    echo "contract name is empty"
    exit 1
  fi
  echo "$contract_name"
}

#get contract address from dss-deploy-scripts/out/$network/addresses.json by contract name(get_contracts_name)
function get_contract_address() {
  contract_name=$1
  contract_address=$(jq -r '."'"$contract_name"'"' "$DSS_DEPLOY_PROJECT_DIR/deploy/dhobyghaut/addresses.json")
#  contract_address=$(jq -r '."'"$contract_name"'"' "$DSS_DEPLOY_PROJECT_DIR/out/$network/addresses.json")

  if [ -z "$contract_address" ]; then
    echo "contract address is empty"
    exit 1
  fi
  echo "$contract_address"
}

#get contract abi from dss-deploy-scripts/out/$network/abi/$contract_name.abi by contract name(get_contracts_name)
function get_lib_name() {
  contract_class=$1
  lib_name=$(jq -r '.[] |select(.contracts[].class=="'"$contract_class"'").lib' "$DSS_DEPLOY_PROJECT_DIR/contracts.json")
  if [ -z "$contract_name" ]; then
    echo "contract name is empty"
    exit 1
  fi
  if [ "$contract_class" == "DSToken" ]; then
    lib_name="ds-token"
  fi
  echo "$lib_name"
}

#get contract abi from dss-deploy-scripts/out/$network/abi/$contract_name.abi by contract name(get_lib_name)
#save {contractName}.abi to subgraph abi/{contractName}.json in dss-deploy-scripts
function get_abi_from_dss_project(){
  filename="$(get_lib_name "$contract_name")"
  path_abi="$DSS_DEPLOY_PROJECT_DIR/out/$network/abi/$filename/$1.abi"
  path_json="$SUBGRAPH_PROJECT_DIR/abis/$1.json"

  if [ -s "$path_abi" ]; then
      cat "$path_abi" >"$path_json"
  else
      echo "File is empty,please check the file path: $path_abi"
  fi

}

# get contract abi from etherscan.io by contract address(get_contract_address)
# first search deploy contract txhash by contract address
# second search contract abi by deploy contract txhash by etherscan.io
function get_create_block_num_by_contract_addr() {
  if [ "$network" == "mainnet" ] || [ "$network" == "goerli" ]; then
    #   This contract addr may be uppercase, so I used "seth --to-hex" to change it to lowercase
    contract_addr="$(seth --to-hex "$1")"
    contract_tx_hash=$(curl -s "$ETHERSCAN_API_PER?module=contract&action=getcontractcreation&contractaddresses=""$1""&apikey=""$ETHSCAN_API_KEY""" | jq -r '.result[]|select(.contractAddress=="'"$contract_addr"'")|.txHash')
    if [ -z "$contract_tx_hash" ]; then
      echo "not found contract tx hash" >&2
      exit 1
    fi
    number=$(curl -s "$ETHERSCAN_API_PER?module=proxy&action=eth_getTransactionReceipt&txhash=""$contract_tx_hash""&apikey=""$ETHSCAN_API_KEY""" | jq -r '.result.blockNumber')
    block="$(seth --to-dec "$number")"
    echo "$block"
  else
    echo "8269000"
  fi
}

# write network.json file
function edit_config() {
  file="$SUBGRAPH_PROJECT_DIR/networks.json"
  file_tmp="$SUBGRAPH_PROJECT_DIR/networks-tmp.json"
  if [ ! -f "$file" ]; then
    echo "{}" >"$file"
  fi
  jq "$1" "$file" >"$file_tmp" || exit 1
  mv "$file_tmp" "$file"
}

# this subgraph sh support function name
CONTRACT_NAMES=("Vat" "Spotter" "Flapper" "Dog" "Flopper" "Vow" "Jug" "Pot" "DSToken" "DSProxyFactory" "DssCdpManager" "Dai" "Clipper" "StairstepExponentialDecrease" "DSChief" "DSPause" "ChainLog")

# init network.json file must used dss-deploy-scripts/out/$network/addresses.json && dss-deploy-scripts/contracts.json
function init_network_data() {
  for contract_name in "${CONTRACT_NAMES[@]}"; do
    echo "contractName":$contract_name
    name="$(get_contracts_name "$contract_name")"
    if [ "$contract_name" == "DSToken" ]; then
      name="MCD_GOV"
    fi
    echo "name":$name
    address="$(get_contract_address "$name")"
    echo "address":$address
    edit_config ".$contract_name.$network.address=\"$address\""
    block=$(get_create_block_num_by_contract_addr "$address")
    echo "startBlock":$block
    edit_config ".$contract_name.$network.startBlock=\"$block\""
  done
}

# get contract abi from etherscan.io by contract address(get_contract_address)
function getAbiByContractAddr() {
  address="$1"
  for i in {1..3}; do
    abi=$(curl -s "$ETHERSCAN_API_PER?module=contract&action=getabi&address=$address&apikey=$ETHSCAN_API_KEY" | jq -r '.result')
    if [ -n "$abi" ]; then
      echo "$abi"
      return
    else
      echo "Attempt $i failed. Retrying..." >&2
    fi
  done
  echo "Failed to retrieve ABI after 3 attempts" >&2
  echo 0
}

# init abi/{contractName}.json file must used dss-deploy-scripts/out/$network/addresses.json && dss-deploy-scripts/contracts.json
function init_abi() {
  if [ ! -d "$SUBGRAPH_PROJECT_DIR/abis" ]; then
    mkdir "$SUBGRAPH_PROJECT_DIR/abis"
  fi
  for contract_name in "${CONTRACT_NAMES[@]}"; do
    echo "contractName":$contract_name
    name="$(get_contracts_name "$contract_name")"
    if [ "$contract_name" == "DSToken" ]; then
      name="MCD_GOV"
    fi
    echo "name":$name
    address="$(get_contract_address "$name")"
    echo "address":$address
    abi=$(getAbiByContractAddr "$address")
    echo "$abi" >"$SUBGRAPH_PROJECT_DIR/abis/$contract_name.json"
  done

}

# init abi/{contractName}.json file must used
# dss-deploy-scripts/contracts.json && dss-deploy-scripts/contracts && dss-deploy-scripts/out/$network/abi/$contract_name.abi
function init_abi_local() {
  mkdir -p "$SUBGRAPH_PROJECT_DIR/abis"
  for contract_name in "${CONTRACT_NAMES[@]}"; do
    echo "contractName":$contract_name
    get_abi_from_dss_project "$contract_name"
    echo "success"
  done
}

if [ "$1" == "init_network_data" ] || [ "$1" == "init_abi" ] || [ "$1" == "init_abi_local" ]; then
  "$@" || (echo "failed: $0" "$@" && exit 1)
else
  echo "$help"
fi
