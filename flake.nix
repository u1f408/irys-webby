{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/release-25.11";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, ... }@inputs:
    let
      mkShell = { pkgs, system, ... }:
        pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs
          ];
        };

    in flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in {
        devShell = mkShell { inherit system pkgs; };
      });
}
