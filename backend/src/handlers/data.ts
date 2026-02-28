import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createEntity, getEntity, updateEntity, deleteEntity, listQuotesByProject, listContractsByProject, listPhotosByProject, listCashFlowsByProject, listQuotesByContractor, listContractsByContractor, listContractsByCustomer, listPhotosByContract, listCashFlowsByContract } from '../services/data-access';
import { Quote, Contract, Photo, CashFlow } from '../models/types';
import { ValidationError, NotFoundError, ConflictError, DataAccessError } from '../utils/errors';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
};

const handleError = (error: Error): APIGatewayProxyResult => {
  let statusCode = 500;
  let message = 'Internal server error';
  
  if (error instanceof ValidationError) {
    statusCode = 400;
    message = error.message;
  } else if (error instanceof NotFoundError) {
    statusCode = 404;
    message = error.message;
  } else if (error instanceof ConflictError) {
    statusCode = 409;
    message = error.message;
  } else if (error instanceof DataAccessError) {
    statusCode = error.retryable ? 503 : 400;
    message = error.message;
  }
  
  return {
    statusCode,
    headers,
    body: JSON.stringify({
      error: message,
      details: error instanceof ValidationError ? error.details : undefined,
    }),
  };
};

export const createQuote: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      throw new ValidationError('Request body is missing');
    }
    
    const quote = JSON.parse(event.body) as Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>;
    const createdQuote = await createEntity('quote', quote);
    
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(createdQuote),
    };
  } catch (error) {
    return handleError(error as Error);
  }
};

export const getQuote: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { quoteId } = event.pathParameters || {};
    const { projectId } = event.queryStringParameters || {};
    
    if (!quoteId || !projectId) {
      throw new ValidationError('quoteId and projectId are required');
    }
    
    const quote = await getEntity<Quote>('quote', quoteId, projectId);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(quote),
    };
  } catch (error) {
    return handleError(error as Error);
  }
};

export const updateQuote: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      throw new ValidationError('Request body is missing');
    }
    
    const { quoteId } = event.pathParameters || {};
    const { projectId } = event.queryStringParameters || {};
    
    if (!quoteId || !projectId) {
      throw new ValidationError('quoteId and projectId are required');
    }
    
    const updates = JSON.parse(event.body) as Partial<Quote>;
    const updatedQuote = await updateEntity<Quote>('quote', quoteId, projectId, updates);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(updatedQuote),
    };
  } catch (error) {
    return handleError(error as Error);
  }
};

export const deleteQuote: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { quoteId } = event.pathParameters || {};
    const { projectId } = event.queryStringParameters || {};
    
    if (!quoteId || !projectId) {
      throw new ValidationError('quoteId and projectId are required');
    }
    
    await deleteEntity('quote', quoteId, projectId);
    
    return {
      statusCode: 204,
      headers,
      body: '',
    };
  } catch (error) {
    return handleError(error as Error);
  }
};

export const listQuotes: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { projectId, contractorId } = event.queryStringParameters || {};
    
    if (projectId) {
      const quotes = await listQuotesByProject(projectId);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(quotes),
      };
    } else if (contractorId) {
      const quotes = await listQuotesByContractor(contractorId);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(quotes),
      };
    } else {
      throw new ValidationError('Either projectId or contractorId is required');
    }
  } catch (error) {
    return handleError(error as Error);
  }
};

export const createContract: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      throw new ValidationError('Request body is missing');
    }
    
    const contract = JSON.parse(event.body) as Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>;
    const createdContract = await createEntity('contract', contract);
    
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(createdContract),
    };
  } catch (error) {
    return handleError(error as Error);
  }
};

export const getContract: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { contractId } = event.pathParameters || {};
    const { projectId } = event.queryStringParameters || {};
    
    if (!contractId || !projectId) {
      throw new ValidationError('contractId and projectId are required');
    }
    
    const contract = await getEntity<Contract>('contract', contractId, projectId);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(contract),
    };
  } catch (error) {
    return handleError(error as Error);
  }
};

export const updateContract: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      throw new ValidationError('Request body is missing');
    }
    
    const { contractId } = event.pathParameters || {};
    const { projectId } = event.queryStringParameters || {};
    
    if (!contractId || !projectId) {
      throw new ValidationError('contractId and projectId are required');
    }
    
    const updates = JSON.parse(event.body) as Partial<Contract>;
    const updatedContract = await updateEntity<Contract>('contract', contractId, projectId, updates);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(updatedContract),
    };
  } catch (error) {
    return handleError(error as Error);
  }
};

export const deleteContract: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { contractId } = event.pathParameters || {};
    const { projectId } = event.queryStringParameters || {};
    
    if (!contractId || !projectId) {
      throw new ValidationError('contractId and projectId are required');
    }
    
    await deleteEntity('contract', contractId, projectId);
    
    return {
      statusCode: 204,
      headers,
      body: '',
    };
  } catch (error) {
    return handleError(error as Error);
  }
};

export const listContracts: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { projectId, contractorId, customerId } = event.queryStringParameters || {};
    
    if (projectId) {
      const contracts = await listContractsByProject(projectId);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(contracts),
      };
    } else if (contractorId) {
      const contracts = await listContractsByContractor(contractorId);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(contracts),
      };
    } else if (customerId) {
      const contracts = await listContractsByCustomer(customerId);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(contracts),
      };
    } else {
      throw new ValidationError('Either projectId, contractorId, or customerId is required');
    }
  } catch (error) {
    return handleError(error as Error);
  }
};

export const createPhoto: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      throw new ValidationError('Request body is missing');
    }
    
    const photo = JSON.parse(event.body) as Omit<Photo, 'id' | 'createdAt' | 'updatedAt'>;
    const createdPhoto = await createEntity('photo', photo);
    
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(createdPhoto),
    };
  } catch (error) {
    return handleError(error as Error);
  }
};

export const getPhoto: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { photoId } = event.pathParameters || {};
    const { projectId } = event.queryStringParameters || {};
    
    if (!photoId || !projectId) {
      throw new ValidationError('photoId and projectId are required');
    }
    
    const photo = await getEntity<Photo>('photo', photoId, projectId);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(photo),
    };
  } catch (error) {
    return handleError(error as Error);
  }
};

export const updatePhoto: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      throw new ValidationError('Request body is missing');
    }
    
    const { photoId } = event.pathParameters || {};
    const { projectId } = event.queryStringParameters || {};
    
    if (!photoId || !projectId) {
      throw new ValidationError('photoId and projectId are required');
    }
    
    const updates = JSON.parse(event.body) as Partial<Photo>;
    const updatedPhoto = await updateEntity<Photo>('photo', photoId, projectId, updates);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(updatedPhoto),
    };
  } catch (error) {
    return handleError(error as Error);
  }
};

export const deletePhoto: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { photoId } = event.pathParameters || {};
    const { projectId } = event.queryStringParameters || {};
    
    if (!photoId || !projectId) {
      throw new ValidationError('photoId and projectId are required');
    }
    
    await deleteEntity('photo', photoId, projectId);
    
    return {
      statusCode: 204,
      headers,
      body: '',
    };
  } catch (error) {
    return handleError(error as Error);
  }
};

export const listPhotos: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { projectId, contractId } = event.queryStringParameters || {};
    
    if (projectId) {
      const photos = await listPhotosByProject(projectId);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(photos),
      };
    } else if (contractId) {
      const photos = await listPhotosByContract(contractId);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(photos),
      };
    } else {
      throw new ValidationError('Either projectId or contractId is required');
    }
  } catch (error) {
    return handleError(error as Error);
  }
};

export const createCashFlow: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      throw new ValidationError('Request body is missing');
    }
    
    const cashFlow = JSON.parse(event.body) as Omit<CashFlow, 'id' | 'createdAt' | 'updatedAt'>;
    const createdCashFlow = await createEntity('cashFlow', cashFlow);
    
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(createdCashFlow),
    };
  } catch (error) {
    return handleError(error as Error);
  }
};

export const getCashFlow: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { cashFlowId } = event.pathParameters || {};
    const { projectId } = event.queryStringParameters || {};
    
    if (!cashFlowId || !projectId) {
      throw new ValidationError('cashFlowId and projectId are required');
    }
    
    const cashFlow = await getEntity<CashFlow>('cashFlow', cashFlowId, projectId);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(cashFlow),
    };
  } catch (error) {
    return handleError(error as Error);
  }
};

export const updateCashFlow: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      throw new ValidationError('Request body is missing');
    }
    
    const { cashFlowId } = event.pathParameters || {};
    const { projectId } = event.queryStringParameters || {};
    
    if (!cashFlowId || !projectId) {
      throw new ValidationError('cashFlowId and projectId are required');
    }
    
    const updates = JSON.parse(event.body) as Partial<CashFlow>;
    const updatedCashFlow = await updateEntity<CashFlow>('cashFlow', cashFlowId, projectId, updates);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(updatedCashFlow),
    };
  } catch (error) {
    return handleError(error as Error);
  }
};

export const deleteCashFlow: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { cashFlowId } = event.pathParameters || {};
    const { projectId } = event.queryStringParameters || {};
    
    if (!cashFlowId || !projectId) {
      throw new ValidationError('cashFlowId and projectId are required');
    }
    
    await deleteEntity('cashFlow', cashFlowId, projectId);
    
    return {
      statusCode: 204,
      headers,
      body: '',
    };
  } catch (error) {
    return handleError(error as Error);
  }
};

export const listCashFlows: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { projectId, contractId } = event.queryStringParameters || {};
    
    if (projectId) {
      const cashFlows = await listCashFlowsByProject(projectId);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(cashFlows),
      };
    } else if (contractId) {
      const cashFlows = await listCashFlowsByContract(contractId);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(cashFlows),
      };
    } else {
      throw new ValidationError('Either projectId or contractId is required');
    }
  } catch (error) {
    return handleError(error as Error);
  }
};