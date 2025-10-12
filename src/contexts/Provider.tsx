/* eslint-disable @typescript-eslint/no-empty-object-type */
import React from "react";
import ParticleConnectkit from "./connectkit";
import ParticleNetworkProvider from "./ParticleNetworkContext";

interface ConnectorProviderContextProps {}

const ConnectorProvider: React.FC<
  React.PropsWithChildren<ConnectorProviderContextProps>
> = ({ children }) => (
  <ParticleConnectkit>
    <ParticleNetworkProvider>{children}</ParticleNetworkProvider>
  </ParticleConnectkit>
);

ConnectorProvider.displayName = "ParticleNetworkProvider";

export default ConnectorProvider;
