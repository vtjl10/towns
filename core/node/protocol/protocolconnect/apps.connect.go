// Code generated by protoc-gen-connect-go. DO NOT EDIT.
//
// Source: apps.proto

package protocolconnect

import (
	connect "connectrpc.com/connect"
	context "context"
	errors "errors"
	protocol "github.com/towns-protocol/towns/core/node/protocol"
	http "net/http"
	strings "strings"
)

// This is a compile-time assertion to ensure that this generated file and the connect package are
// compatible. If you get a compiler error that this constant is not defined, this code was
// generated with a version of connect newer than the one compiled into your binary. You can fix the
// problem by either regenerating this code with an older version of connect or updating the connect
// version compiled into your binary.
const _ = connect.IsAtLeastVersion1_13_0

const (
	// AppRegistryServiceName is the fully-qualified name of the AppRegistryService service.
	AppRegistryServiceName = "river.AppRegistryService"
)

// These constants are the fully-qualified names of the RPCs defined in this package. They're
// exposed at runtime as Spec.Procedure and as the final two segments of the HTTP route.
//
// Note that these are different from the fully-qualified method names used by
// google.golang.org/protobuf/reflect/protoreflect. To convert from these constants to
// reflection-formatted method names, remove the leading slash and convert the remaining slash to a
// period.
const (
	// AppRegistryServiceRegisterProcedure is the fully-qualified name of the AppRegistryService's
	// Register RPC.
	AppRegistryServiceRegisterProcedure = "/river.AppRegistryService/Register"
	// AppRegistryServiceRegisterWebhookProcedure is the fully-qualified name of the
	// AppRegistryService's RegisterWebhook RPC.
	AppRegistryServiceRegisterWebhookProcedure = "/river.AppRegistryService/RegisterWebhook"
	// AppRegistryServiceRotateSecretProcedure is the fully-qualified name of the AppRegistryService's
	// RotateSecret RPC.
	AppRegistryServiceRotateSecretProcedure = "/river.AppRegistryService/RotateSecret"
	// AppRegistryServiceGetStatusProcedure is the fully-qualified name of the AppRegistryService's
	// GetStatus RPC.
	AppRegistryServiceGetStatusProcedure = "/river.AppRegistryService/GetStatus"
	// AppRegistryServiceGetSessionProcedure is the fully-qualified name of the AppRegistryService's
	// GetSession RPC.
	AppRegistryServiceGetSessionProcedure = "/river.AppRegistryService/GetSession"
)

// These variables are the protoreflect.Descriptor objects for the RPCs defined in this package.
var (
	appRegistryServiceServiceDescriptor               = protocol.File_apps_proto.Services().ByName("AppRegistryService")
	appRegistryServiceRegisterMethodDescriptor        = appRegistryServiceServiceDescriptor.Methods().ByName("Register")
	appRegistryServiceRegisterWebhookMethodDescriptor = appRegistryServiceServiceDescriptor.Methods().ByName("RegisterWebhook")
	appRegistryServiceRotateSecretMethodDescriptor    = appRegistryServiceServiceDescriptor.Methods().ByName("RotateSecret")
	appRegistryServiceGetStatusMethodDescriptor       = appRegistryServiceServiceDescriptor.Methods().ByName("GetStatus")
	appRegistryServiceGetSessionMethodDescriptor      = appRegistryServiceServiceDescriptor.Methods().ByName("GetSession")
)

// AppRegistryServiceClient is a client for the river.AppRegistryService service.
type AppRegistryServiceClient interface {
	Register(context.Context, *connect.Request[protocol.RegisterRequest]) (*connect.Response[protocol.RegisterResponse], error)
	RegisterWebhook(context.Context, *connect.Request[protocol.RegisterWebhookRequest]) (*connect.Response[protocol.RegisterWebhookResponse], error)
	RotateSecret(context.Context, *connect.Request[protocol.RotateSecretRequest]) (*connect.Response[protocol.RotateSecretResponse], error)
	GetStatus(context.Context, *connect.Request[protocol.GetStatusRequest]) (*connect.Response[protocol.GetStatusResponse], error)
	GetSession(context.Context, *connect.Request[protocol.GetSessionRequest]) (*connect.Response[protocol.GetSessionResponse], error)
}

// NewAppRegistryServiceClient constructs a client for the river.AppRegistryService service. By
// default, it uses the Connect protocol with the binary Protobuf Codec, asks for gzipped responses,
// and sends uncompressed requests. To use the gRPC or gRPC-Web protocols, supply the
// connect.WithGRPC() or connect.WithGRPCWeb() options.
//
// The URL supplied here should be the base URL for the Connect or gRPC server (for example,
// http://api.acme.com or https://acme.com/grpc).
func NewAppRegistryServiceClient(httpClient connect.HTTPClient, baseURL string, opts ...connect.ClientOption) AppRegistryServiceClient {
	baseURL = strings.TrimRight(baseURL, "/")
	return &appRegistryServiceClient{
		register: connect.NewClient[protocol.RegisterRequest, protocol.RegisterResponse](
			httpClient,
			baseURL+AppRegistryServiceRegisterProcedure,
			connect.WithSchema(appRegistryServiceRegisterMethodDescriptor),
			connect.WithClientOptions(opts...),
		),
		registerWebhook: connect.NewClient[protocol.RegisterWebhookRequest, protocol.RegisterWebhookResponse](
			httpClient,
			baseURL+AppRegistryServiceRegisterWebhookProcedure,
			connect.WithSchema(appRegistryServiceRegisterWebhookMethodDescriptor),
			connect.WithClientOptions(opts...),
		),
		rotateSecret: connect.NewClient[protocol.RotateSecretRequest, protocol.RotateSecretResponse](
			httpClient,
			baseURL+AppRegistryServiceRotateSecretProcedure,
			connect.WithSchema(appRegistryServiceRotateSecretMethodDescriptor),
			connect.WithClientOptions(opts...),
		),
		getStatus: connect.NewClient[protocol.GetStatusRequest, protocol.GetStatusResponse](
			httpClient,
			baseURL+AppRegistryServiceGetStatusProcedure,
			connect.WithSchema(appRegistryServiceGetStatusMethodDescriptor),
			connect.WithClientOptions(opts...),
		),
		getSession: connect.NewClient[protocol.GetSessionRequest, protocol.GetSessionResponse](
			httpClient,
			baseURL+AppRegistryServiceGetSessionProcedure,
			connect.WithSchema(appRegistryServiceGetSessionMethodDescriptor),
			connect.WithClientOptions(opts...),
		),
	}
}

// appRegistryServiceClient implements AppRegistryServiceClient.
type appRegistryServiceClient struct {
	register        *connect.Client[protocol.RegisterRequest, protocol.RegisterResponse]
	registerWebhook *connect.Client[protocol.RegisterWebhookRequest, protocol.RegisterWebhookResponse]
	rotateSecret    *connect.Client[protocol.RotateSecretRequest, protocol.RotateSecretResponse]
	getStatus       *connect.Client[protocol.GetStatusRequest, protocol.GetStatusResponse]
	getSession      *connect.Client[protocol.GetSessionRequest, protocol.GetSessionResponse]
}

// Register calls river.AppRegistryService.Register.
func (c *appRegistryServiceClient) Register(ctx context.Context, req *connect.Request[protocol.RegisterRequest]) (*connect.Response[protocol.RegisterResponse], error) {
	return c.register.CallUnary(ctx, req)
}

// RegisterWebhook calls river.AppRegistryService.RegisterWebhook.
func (c *appRegistryServiceClient) RegisterWebhook(ctx context.Context, req *connect.Request[protocol.RegisterWebhookRequest]) (*connect.Response[protocol.RegisterWebhookResponse], error) {
	return c.registerWebhook.CallUnary(ctx, req)
}

// RotateSecret calls river.AppRegistryService.RotateSecret.
func (c *appRegistryServiceClient) RotateSecret(ctx context.Context, req *connect.Request[protocol.RotateSecretRequest]) (*connect.Response[protocol.RotateSecretResponse], error) {
	return c.rotateSecret.CallUnary(ctx, req)
}

// GetStatus calls river.AppRegistryService.GetStatus.
func (c *appRegistryServiceClient) GetStatus(ctx context.Context, req *connect.Request[protocol.GetStatusRequest]) (*connect.Response[protocol.GetStatusResponse], error) {
	return c.getStatus.CallUnary(ctx, req)
}

// GetSession calls river.AppRegistryService.GetSession.
func (c *appRegistryServiceClient) GetSession(ctx context.Context, req *connect.Request[protocol.GetSessionRequest]) (*connect.Response[protocol.GetSessionResponse], error) {
	return c.getSession.CallUnary(ctx, req)
}

// AppRegistryServiceHandler is an implementation of the river.AppRegistryService service.
type AppRegistryServiceHandler interface {
	Register(context.Context, *connect.Request[protocol.RegisterRequest]) (*connect.Response[protocol.RegisterResponse], error)
	RegisterWebhook(context.Context, *connect.Request[protocol.RegisterWebhookRequest]) (*connect.Response[protocol.RegisterWebhookResponse], error)
	RotateSecret(context.Context, *connect.Request[protocol.RotateSecretRequest]) (*connect.Response[protocol.RotateSecretResponse], error)
	GetStatus(context.Context, *connect.Request[protocol.GetStatusRequest]) (*connect.Response[protocol.GetStatusResponse], error)
	GetSession(context.Context, *connect.Request[protocol.GetSessionRequest]) (*connect.Response[protocol.GetSessionResponse], error)
}

// NewAppRegistryServiceHandler builds an HTTP handler from the service implementation. It returns
// the path on which to mount the handler and the handler itself.
//
// By default, handlers support the Connect, gRPC, and gRPC-Web protocols with the binary Protobuf
// and JSON codecs. They also support gzip compression.
func NewAppRegistryServiceHandler(svc AppRegistryServiceHandler, opts ...connect.HandlerOption) (string, http.Handler) {
	appRegistryServiceRegisterHandler := connect.NewUnaryHandler(
		AppRegistryServiceRegisterProcedure,
		svc.Register,
		connect.WithSchema(appRegistryServiceRegisterMethodDescriptor),
		connect.WithHandlerOptions(opts...),
	)
	appRegistryServiceRegisterWebhookHandler := connect.NewUnaryHandler(
		AppRegistryServiceRegisterWebhookProcedure,
		svc.RegisterWebhook,
		connect.WithSchema(appRegistryServiceRegisterWebhookMethodDescriptor),
		connect.WithHandlerOptions(opts...),
	)
	appRegistryServiceRotateSecretHandler := connect.NewUnaryHandler(
		AppRegistryServiceRotateSecretProcedure,
		svc.RotateSecret,
		connect.WithSchema(appRegistryServiceRotateSecretMethodDescriptor),
		connect.WithHandlerOptions(opts...),
	)
	appRegistryServiceGetStatusHandler := connect.NewUnaryHandler(
		AppRegistryServiceGetStatusProcedure,
		svc.GetStatus,
		connect.WithSchema(appRegistryServiceGetStatusMethodDescriptor),
		connect.WithHandlerOptions(opts...),
	)
	appRegistryServiceGetSessionHandler := connect.NewUnaryHandler(
		AppRegistryServiceGetSessionProcedure,
		svc.GetSession,
		connect.WithSchema(appRegistryServiceGetSessionMethodDescriptor),
		connect.WithHandlerOptions(opts...),
	)
	return "/river.AppRegistryService/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case AppRegistryServiceRegisterProcedure:
			appRegistryServiceRegisterHandler.ServeHTTP(w, r)
		case AppRegistryServiceRegisterWebhookProcedure:
			appRegistryServiceRegisterWebhookHandler.ServeHTTP(w, r)
		case AppRegistryServiceRotateSecretProcedure:
			appRegistryServiceRotateSecretHandler.ServeHTTP(w, r)
		case AppRegistryServiceGetStatusProcedure:
			appRegistryServiceGetStatusHandler.ServeHTTP(w, r)
		case AppRegistryServiceGetSessionProcedure:
			appRegistryServiceGetSessionHandler.ServeHTTP(w, r)
		default:
			http.NotFound(w, r)
		}
	})
}

// UnimplementedAppRegistryServiceHandler returns CodeUnimplemented from all methods.
type UnimplementedAppRegistryServiceHandler struct{}

func (UnimplementedAppRegistryServiceHandler) Register(context.Context, *connect.Request[protocol.RegisterRequest]) (*connect.Response[protocol.RegisterResponse], error) {
	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("river.AppRegistryService.Register is not implemented"))
}

func (UnimplementedAppRegistryServiceHandler) RegisterWebhook(context.Context, *connect.Request[protocol.RegisterWebhookRequest]) (*connect.Response[protocol.RegisterWebhookResponse], error) {
	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("river.AppRegistryService.RegisterWebhook is not implemented"))
}

func (UnimplementedAppRegistryServiceHandler) RotateSecret(context.Context, *connect.Request[protocol.RotateSecretRequest]) (*connect.Response[protocol.RotateSecretResponse], error) {
	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("river.AppRegistryService.RotateSecret is not implemented"))
}

func (UnimplementedAppRegistryServiceHandler) GetStatus(context.Context, *connect.Request[protocol.GetStatusRequest]) (*connect.Response[protocol.GetStatusResponse], error) {
	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("river.AppRegistryService.GetStatus is not implemented"))
}

func (UnimplementedAppRegistryServiceHandler) GetSession(context.Context, *connect.Request[protocol.GetSessionRequest]) (*connect.Response[protocol.GetSessionResponse], error) {
	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("river.AppRegistryService.GetSession is not implemented"))
}
