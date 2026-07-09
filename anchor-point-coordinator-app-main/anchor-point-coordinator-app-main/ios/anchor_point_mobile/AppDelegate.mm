#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>

#import <Firebase.h>
#import <FirebaseCrashlytics/FirebaseCrashlytics.h> 

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [FIRApp configure];
  [FIRCrashlytics crashlytics];
  self.moduleName = @"anchor_point_mobile";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  BOOL success = [super application:application didFinishLaunchingWithOptions:launchOptions];
  if(success) {
    UIStoryboard *sb = [UIStoryboard storyboardWithName:@"LaunchScreen" bundle:nil];
    UIViewController *vc = [sb instantiateInitialViewController];
    RCTRootView *rootView = (RCTRootView *)self.window.rootViewController.view;
    rootView.loadingView = vc.view;
  }
  return success;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end

//#import "AppDelegate.h"
//
//#import <React/RCTBridge.h>
//#import <React/RCTBundleURLProvider.h>
//#import <React/RCTRootView.h>
//
//#import <Firebase.h>
//#import <FirebaseCrashlytics/FirebaseCrashlytics.h>
//
//@implementation AppDelegate
//
//- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
//{
//  // Initialize Firebase
//  [FIRApp configure];
//  [FIRCrashlytics crashlytics];
//
//  // Create React Native bridge and root view
//  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
//  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
//                                                   moduleName:@"anchor_point_mobile"
//                                            initialProperties:nil];
//
//  // Optional: Set background color
//  rootView.backgroundColor = [UIColor whiteColor];
//
//  // Create and configure root view controller
//  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
//  UIViewController *rootViewController = [UIViewController new];
//  rootViewController.view = rootView;
//  self.window.rootViewController = rootViewController;
//
//  // Show launch screen as loading view
//  UIStoryboard *sb = [UIStoryboard storyboardWithName:@"LaunchScreen" bundle:nil];
//  UIViewController *launchVC = [sb instantiateInitialViewController];
//  if (launchVC) {
//    rootView.loadingView = launchVC.view;
//  }
//
//  [self.window makeKeyAndVisible];
//  return YES;
//}
//
//- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
//{
//#if DEBUG
//  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
//#else
//  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
//#endif
//}
//
//@end

