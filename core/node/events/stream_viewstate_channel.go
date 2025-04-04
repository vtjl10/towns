package events

import (
	. "github.com/towns-protocol/towns/core/node/base"
	. "github.com/towns-protocol/towns/core/node/protocol"
)

type ChannelStreamView interface {
	JoinableStreamView
	GetChannelInception() (*ChannelPayload_Inception, error)
}

var _ ChannelStreamView = (*StreamView)(nil)

func (r *StreamView) GetChannelInception() (*ChannelPayload_Inception, error) {
	i := r.InceptionPayload()
	c, ok := i.(*ChannelPayload_Inception)
	if ok {
		return c, nil
	} else {
		return nil, RiverError(Err_WRONG_STREAM_TYPE, "Expected channel stream", "streamId", i.GetStreamId())
	}
}
