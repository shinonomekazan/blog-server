import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
admin.initializeApp(functions.config().firebase);
const firestore = admin.firestore();

interface UserPost {
	subject: string;
	body: string;
	created: FirebaseFirestore.Timestamp;
	updated: FirebaseFirestore.Timestamp;
}

interface AllPost {
	userId: string;
	userName: string;
	postRef: FirebaseFirestore.DocumentReference;
	userDisplayName: string;
	subject: string;
	body: string;
	created: FirebaseFirestore.Timestamp;
	updated: FirebaseFirestore.Timestamp;
}

interface UserData {
	id: string;
	created: FirebaseFirestore.Timestamp;
	name: string;
	displayName: string;
	postCount: number;
}

async function copyToAllPost(snapshot: FirebaseFirestore.DocumentSnapshot, userName: string) {
	const post = snapshot.data() as UserPost;
	try {
		const user = await firestore.collection("users").doc(userName).get();
		const userData = user.data() as UserData;
		const allPost = {
			userId: userData.id,
			userName: userData.name,
			userDisplayName: userData.displayName,
			postRef: snapshot.ref,
			created: post.created,
			updated: post.updated,
			subject: post.subject,
			body: post.body,
		} as AllPost;
		return await firestore.collection("allPosts").add(allPost);
	} catch (error) {
		return Promise.reject(error);
	}
}

async function incrementUserPostCount(userName: string) {
	try {
		// 本当はこの参照を一つやめたいが現状手がなさそう
		const userRef = firestore.collection("users").doc(userName);
		const userData = (await userRef.get()).data()!;
		const postCount = userData.postCount + 1;
		return userRef.update({
			postCount
		});
	} catch (error) {
		return Promise.reject(error);
	}
}

async function decrementUserPostCount(userName: string) {
	try {
		// 本当はこの参照を一つやめたいが現状手がなさそう
		const userRef = firestore.collection("users").doc(userName);
		const userData = (await userRef.get()).data()!;
		const postCount = userData.postCount - 1;
		return userRef.update({
			postCount
		});
	} catch (error) {
		return Promise.reject(error);
	}
}

async function updateToAllPost(oldPost: FirebaseFirestore.DocumentSnapshot,
	newPost: FirebaseFirestore.DocumentSnapshot,
	userName: string) {
	// const postId: string = context.params.postId;
	const oldPostRef = oldPost.ref
	const post = newPost.data() as UserPost;
	try {
		const user = await firestore.collection("users").doc(userName).get();
		const userData = user.data() as UserData;
		const allPost = {
			userId: userData.id,
			userName: userData.name,
			userDisplayName: userData.displayName,
			postRef: newPost.ref,
			created: post.created,
			updated: post.updated,
			subject: post.subject,
			body: post.body,
		} as AllPost;
		const oldAllPosts = await firestore.collection("allPosts").where("postRef", "==", oldPostRef).get();
		let count = 0;
		const promises: Promise<FirebaseFirestore.WriteResult>[] = [];
		oldAllPosts.forEach((oldAllPost) => {
			if (++count > 1) {
				// error!
			}
			promises.push(firestore.collection("allPosts").doc(oldAllPost.id).set(
				allPost,
				{merge: true}
			));
		});
		if (count === 0) {
			// error!
		}
		const result = await Promise.all(promises);
		return result[0];
	} catch (error) {
		return Promise.reject(error);
	}
}

async function copyToUserToUserIds(snapshot: FirebaseFirestore.DocumentSnapshot, context: functions.EventContext) {
	const user = snapshot.data() as UserData;
	try {
		const userIdData = {
			name: user.name
		};
		return await firestore.collection("userIds").doc(user.id).set(userIdData);
	} catch (error) {
		return Promise.reject(error);
	}
}

function writeUserPostHandler(
	change: functions.Change<FirebaseFirestore.DocumentSnapshot>,
	context: functions.EventContext) {

	const userName = context.params.userName as string;

	if (change.before == null || !change.before.exists) {
		// beforeがないのでcreateと判定
		if (change.after == null || ! change.after.exists) {
			return Promise.reject(new Error("before and after is null"));
		}
		const copyPromise = copyToAllPost(change.after, userName);
		const incrementPromise = incrementUserPostCount(userName);
		return Promise.all([copyPromise, incrementPromise]);
	} else if (change.after == null || !change.after.exists) {
		// afterがないのでdeleteと判定
		return decrementUserPostCount(userName);
	} else {
		// 両方あるのでupdateと判定
		return updateToAllPost(change.before, change.after, userName);
	}
}

const userPosts = functions.firestore.document("/users/{userName}/posts/{postId}");
export const onUserPostWrite = userPosts.onWrite(writeUserPostHandler);
// 元々はonCreateとonUpdateを療法トラップしていたが、一度onWriteで一括で受けることにした
// export const onUserPostCreate = userPosts.onCreate(copyToAllPost);
// export const onUserPostUpdate = userPosts.onUpdate(updateToAllPost);
export const onUserCreate = functions.firestore.document("/users/{userName}").onCreate(copyToUserToUserIds);
