async function makeApiCall(url, method = 'GET', headers = {}, body = null) {
    try {
        // Prepare request options
        const options = {
            method: method,  // HTTP method
            headers: {
                'Content-Type': 'application/json', // Default header
                ...headers   // Merge custom headers if provided
            }
        };

        // Add body to request if provided (for POST, PUT, etc.)
        if (body) {
            options.body = JSON.stringify(body);  // Convert body object to JSON
        }

        // Make the fetch call
        const response = await fetch(url, options);

        // Check if the response is successful (status code 200-299)
        if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }

        // Parse the response JSON
        const data = await response.json();

        // Return the response data
        return data;
    } catch (error) {
        // Handle any errors during the request
        console.error('API call failed:', error);
        throw error;  // Rethrow error so caller can handle it
    }
}