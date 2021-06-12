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
	.getElementById("createAnswer")
	.addEventListener("click", async (event) => {
		const txt = document.getElementById("sdpOffer").value;
		const offer = JSON.parse(txt);

		conn = new RTCPeerConnection({
			iceServers
		});

		conn.addEventListener("connectionstatechange", console.log);
		conn.addEventListener("icecandidate", (event) => {
			if (event.candidate) {
				candidates.push(event.candidate);
			}
		});
		conn.addEventListener("icecandidateerror", console.log);
		conn.addEventListener("iceconnectionstatechange", console.log);
		conn.addEventListener("icegatheringstatechange", console.log);
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

		await conn.setRemoteDescription(offer);
		const answer = await conn.createAnswer(offer);
		await conn.setLocalDescription(answer);

		console.log("answer", answer);
		document.getElementById("sdpAnswer").value = JSON.stringify(answer);
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
