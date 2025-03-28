import asyncio
import json
import websockets
import requests


async def test_gemini_live():
    # Create a session
    response = requests.post("http://localhost:8000/api/sessions")
    session_data = response.json()
    session_id = session_data["session_id"]
    print(f"Created session: {session_id}")

    # Connect to WebSocket
    uri = f"ws://localhost:8000/api/ws/{session_id}"
    async with websockets.connect(uri) as websocket:
        # Receive welcome message
        response = await websocket.recv()
        print(f"Server: {json.loads(response)['content']}")

        # Send text message
        message = {"type": "text", "content": "Hello, tell me a short story"}
        await websocket.send(json.dumps(message))
        print(f"Sent: {message['content']}")

        # Receive responses until final message
        complete_response = ""
        while True:
            response = await websocket.recv()
            data = json.loads(response)

            if data["type"] == "text" and data["content"]:
                print(f"Received text: {data['content']}")
                complete_response += data["content"]
            elif data["type"] == "audio":
                print(f"Received audio chunk")

            if data.get("is_final", False):
                break

        print(f"\nComplete response: {complete_response}")


if __name__ == "__main__":
    asyncio.run(test_gemini_live())
