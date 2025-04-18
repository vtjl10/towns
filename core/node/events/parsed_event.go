package events

import (
	"bytes"
	"strings"

	"github.com/ethereum/go-ethereum/common"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"

	. "github.com/towns-protocol/towns/core/node/base"
	. "github.com/towns-protocol/towns/core/node/crypto"
	. "github.com/towns-protocol/towns/core/node/protocol"
	. "github.com/towns-protocol/towns/core/node/shared"
)

type ParsedEvent struct {
	Event         *StreamEvent
	Envelope      *Envelope
	Hash          common.Hash
	MiniblockRef  *MiniblockRef
	SignerPubKey  []byte
	shortDebugStr string
}

func (e *ParsedEvent) GetEnvelopeBytes() ([]byte, error) {
	b, err := proto.Marshal(e.Envelope)
	if err == nil {
		return b, nil
	}
	return nil, AsRiverError(err, Err_INTERNAL).
		Message("Failed to marshal parsed event envelope to bytes").
		Func("GetEnvelopeBytes")
}

func ParseEvent(envelope *Envelope) (*ParsedEvent, error) {
	if envelope == nil {
		return nil, RiverError(Err_BAD_EVENT, "Nil envelope provided").Func("ParseEvent")
	}
	hash := TownsHashForEvents.Hash(envelope.Event)
	if !bytes.Equal(hash[:], envelope.Hash) {
		return nil, RiverError(Err_BAD_EVENT_HASH, "Bad hash provided", "computed", hash, "got", envelope.Hash)
	}

	signerPubKey, err := RecoverSignerPublicKey(hash[:], envelope.Signature)
	if err != nil {
		return nil, err
	}

	var streamEvent StreamEvent
	err = proto.Unmarshal(envelope.Event, &streamEvent)
	if err != nil {
		return nil, AsRiverError(err, Err_INVALID_ARGUMENT).
			Message("Failed to decode stream event from bytes").
			Func("ParseEvent")
	}

	if len(streamEvent.DelegateSig) > 0 {
		err := CheckDelegateSig(
			streamEvent.CreatorAddress,
			signerPubKey,
			streamEvent.DelegateSig,
			streamEvent.DelegateExpiryEpochMs,
		)
		if err != nil {
			return nil, WrapRiverError(
				Err_BAD_EVENT_SIGNATURE,
				err,
			).Message("Bad signature").
				Func("ParseEvent")
		}
	} else {
		address := PublicKeyToAddress(signerPubKey)
		if !bytes.Equal(address.Bytes(), streamEvent.CreatorAddress) {
			return nil, RiverError(Err_BAD_EVENT_SIGNATURE, "Bad signature provided",
				"computed address", address,
				"event creatorAddress", streamEvent.CreatorAddress)
		}
	}

	prevMiniblockNum := int64(-1)
	if streamEvent.PrevMiniblockNum != nil {
		prevMiniblockNum = *streamEvent.PrevMiniblockNum
	}

	return &ParsedEvent{
		Event:    &streamEvent,
		Envelope: envelope,
		Hash:     common.BytesToHash(envelope.Hash),
		MiniblockRef: &MiniblockRef{
			Hash: common.BytesToHash(streamEvent.PrevMiniblockHash),
			Num:  prevMiniblockNum,
		},
		SignerPubKey: signerPubKey,
	}, nil
}

func (e *ParsedEvent) ShortDebugStr() string {
	if e == nil {
		return "nil"
	}
	if (e.shortDebugStr) != "" {
		return e.shortDebugStr
	}

	e.shortDebugStr = FormatEventShort(e)
	return e.shortDebugStr
}

func FormatEventToJsonSB(sb *strings.Builder, event *ParsedEvent) {
	sb.WriteString(protojson.Format(event.Event))
}

// TODO(HNT-1381): needs to be refactored
func FormatEventsToJson(events []*Envelope) string {
	sb := strings.Builder{}
	sb.WriteString("[")
	for idx, event := range events {
		parsedEvent, err := ParseEvent(event)
		if err == nil {
			sb.WriteString("{ \"envelope\": ")

			sb.WriteString(protojson.Format(parsedEvent.Envelope))
			sb.WriteString(", \"event\": ")
			sb.WriteString(protojson.Format(parsedEvent.Event))
			sb.WriteString(" }")
		} else {
			sb.WriteString("{ \"error\": \"" + err.Error() + "\" }")
		}
		if idx < len(events)-1 {
			sb.WriteString(",")
		}
	}
	sb.WriteString("]")
	return sb.String()
}

func ParseEvents(events []*Envelope) ([]*ParsedEvent, error) {
	parsedEvents := make([]*ParsedEvent, len(events))
	for i, event := range events {
		parsedEvent, err := ParseEvent(event)
		if err != nil {
			return nil, AsRiverError(err, Err_BAD_EVENT).
				Tag("CorruptEventIndex", i).
				Func("ParseEvents")
		}
		parsedEvents[i] = parsedEvent
	}
	return parsedEvents, nil
}

// TODO: doesn't belong here, refactor
func (e *ParsedEvent) GetChannelMessage() *ChannelPayload_Message {
	switch payload := e.Event.Payload.(type) {
	case *StreamEvent_ChannelPayload:
		switch cp := payload.ChannelPayload.Content.(type) {
		case *ChannelPayload_Message:
			return cp
		}
	}
	return nil
}

func (e *ParsedEvent) GetEncryptedMessage() *EncryptedData {
	switch payload := e.Event.Payload.(type) {
	case *StreamEvent_ChannelPayload:
		switch cp := payload.ChannelPayload.Content.(type) {
		case *ChannelPayload_Message:
			return cp.Message
		}
	case *StreamEvent_DmChannelPayload:
		switch cp := payload.DmChannelPayload.Content.(type) {
		case *DmChannelPayload_Message:
			return cp.Message
		}
	case *StreamEvent_GdmChannelPayload:
		switch cp := payload.GdmChannelPayload.Content.(type) {
		case *GdmChannelPayload_Message:
			return cp.Message
		}
	}
	return nil
}
