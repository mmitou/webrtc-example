"use strict";

let localVideoStream = null;
let conn = null;
let candidates = [];

const iceServers = [
	{
		url: "stun:13.231.83.120:3478",
	},
	{
		url: "turn:13.231.83.120:3478",
		username: "foo",
		credential: "bar",
	},
];

document
	.getElementById("localVideoButton")
	.addEventListener("click", async (event) => {
		const localVideo = document.getElementById("localVideo");
		if (localVideoStream) {
			localVideo.srcObject.getTracks().forEach((track) => {
				track.stop();
			});
			localVideoStream = null;
			localVideo.srcObject = null;
		} else {
			localVideoStream = await navigator.mediaDevices.getUserMedia({
				video: true,
				audio: false,
			});
			localVideo.srcObject = localVideoStream;
		}
	});

document
	.getElementById("createOfferButton")
	.addEventListener("click", async (event) => {
		conn = new RTCPeerConnection({
			iceServers: iceServers 
		});
		conn.addEventListener("connectionstatechange", console.log);
		conn.addEventListener("icecandidate", (event) => {
			if (event.candidate) {
				console.log("icecandidate", event.candidate);
				candidates.push(event.candidate);
			}
		});
		conn.addEventListener("icecandidateerror", ({ errorCode, errorText }) => {
			console.log("icecandidateerror", { errorCode, errorText });
		});
		conn.addEventListener("iceconnectionstatechange", (event) => {
			console.log("iceconnectionstatechange", {
				iceConnectionState: event.currentTarget.iceConnectionState,
				iceGatheringState: event.currentTarget.iceGatheringState,
			});
		});
		conn.addEventListener("icegatheringstatechange", (event) => {
			console.log("icegatheringstatechange", {
				iceConnectionState: event.currentTarget.iceConnectionState,
				iceGatheringState: event.currentTarget.iceGatheringState,
			});
		});
		conn.addEventListener("negotiationneeded", console.log);
		conn.addEventListener("statsended", console.log);
		conn.addEventListener("track", (event) => {
			console.log("track", event);
			const stream = event.streams[0];
			document.getElementById("remoteVideo").srcObject = stream;
		});

		localVideoStream.getTracks().forEach((track) => {
			conn.addTrack(track, localVideoStream);
		});

		const offer = await conn.createOffer();

		console.log("sdp offer", offer);
		document.getElementById("sdpOffer").value = JSON.stringify(offer);
	});

document
	.getElementById("setLocalDescriptionButtion")
	.addEventListener("click", async (event) => {
		const txt = document.getElementById("sdpOffer").value;
		const offer = JSON.parse(txt);
		await conn.setLocalDescription(offer);
	});

document
	.getElementById("recieveAnswerButton")
	.addEventListener("click", async (event) => {
		const txt = document.getElementById("sdpAnswer").value;
		const answer = JSON.parse(txt);
		await conn.setRemoteDescription(answer);
	});

document
	.getElementById("showIceCandidatesButton")
	.addEventListener("click", (event) => {
		const txt = JSON.stringify(candidates);
		document.getElementById("candidates").value = txt;
	});

document
	.getElementById("recieveCandidateButton")
	.addEventListener("click", async (event) => {
		const txt = document.getElementById("candidate").value;
		const cs = JSON.parse(txt);
		for (const candidate of cs) {
			await conn.addIceCandidate(candidate);
		}
	});
