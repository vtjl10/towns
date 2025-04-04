import { useAgentConnection } from '@towns-protocol/react-sdk'
import { Navigate } from 'react-router-dom'

export const IndexRoute = () => {
    const { isAgentConnected } = useAgentConnection()

    if (isAgentConnected) {
        return <Navigate to="/t" />
    }
    return <Navigate to="/auth" />
}
