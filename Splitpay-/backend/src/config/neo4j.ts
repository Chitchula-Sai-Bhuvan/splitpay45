
export const connectNeo4j = async () => {
    console.log('Skipping Neo4j connection (Disabled)');
};

// Mock driver object
const driver = {
    session: () => ({
        run: async (...args: any[]) => ({ records: [] }),
        close: async () => { }
    }),
    verifyConnectivity: async () => { },
    close: async () => { }
};

export default driver;
